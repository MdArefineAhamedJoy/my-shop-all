(() => {
  'use strict';
  const data = window.MYSHOP_ATLAS;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tables = Object.fromEntries(data.tables.map(t => [t.name, t]));
  const domains = Object.fromEntries(data.domains.map(d => [d.id, d]));
  const state = { view: 'schema', domain: 'orders', selected: 'orders', focus: false, allColumns: false, scale: 1, x: 0, y: 0, bounds: { width: 1000, height: 700 }, diagram: 0 };
  const copyText = async text => {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
    catch { const area = document.createElement('textarea'); area.value = text; document.body.append(area); area.select(); const ok = document.execCommand('copy'); area.remove(); toast(ok ? 'Copied to clipboard' : 'Select the code and copy it manually'); }
  };
  let toastTimer;
  function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800); }
  const titleMap = {
    schema: ['Your database, <em>connected.</em>', 'টেবিলে ক্লিক করুন—column, primary key, foreign key ও index একসঙ্গে দেখুন।'],
    relations: ['Every foreign key. <em>Explicit.</em>', 'প্রতিটি FK কোথায় যুক্ত, nullable কি না, cardinality ও delete policy—সব এক জায়গায়।'],
    optimization: ['Built for correctness. <em>Ready to tune.</em>', 'Query অনুযায়ী index, transaction safety ও database maintenance-এর বিস্তারিত পরিকল্পনা।'],
    architecture: ['The complete <em>system picture.</em>', 'Architecture থেকে checkout, payment, deployment ও refund—সব diagram সরাসরি দেখুন।'],
    api: ['Three clients. <em>One contract.</em>', 'Web, admin ও mobile-এর জন্য প্রস্তাবিত API, access control ও business commands।'],
    documents: ['The reasoning, <em>in full.</em>', 'Project exploration, system design, database, API ও implementation plan এখানেই পড়ুন।'],
  };
  const viewLabels = { schema: 'Database explorer', relations: 'Foreign keys', optimization: 'Optimization', architecture: 'Architecture diagrams', api: 'API contracts', documents: 'Full documentation' };
  function setView(view, updateHash = true) {
    if (!titleMap[view]) view = 'schema';
    state.view = view;
    $$('.view').forEach(el => el.classList.toggle('active', el.id === `view-${view}`));
    $$('[data-view]').forEach(el => el.classList.toggle('active', el.dataset.view === view));
    $('#breadcrumb').textContent = viewLabels[view];
    $('#page-title').innerHTML = titleMap[view][0]; $('#page-description').textContent = titleMap[view][1];
    if (updateHash) history.replaceState(null, '', `#${view}`);
    if (view === 'schema') requestAnimationFrame(fitGraph);
    $('.sidebar').classList.remove('open');
  }
  function updateNavigation() {
    $$('[data-domain]').forEach(el => el.classList.toggle('selected', el.dataset.domain === state.domain && !state.focus));
    renderTableList();
  }
  function renderTableList() {
    const search = $('#table-search').value.trim().toLowerCase();
    const matches = data.tables.filter(t => (search || state.domain === 'all' || t.domain === state.domain) && (!search || t.name.includes(search) || t.columns.some(c => c.name.includes(search))));
    $('#table-list').innerHTML = matches.map(t => `<button class="table-link ${state.selected === t.name ? 'selected' : ''}" data-table="${t.name}"><span>▤</span>${t.name}</button>`).join('') || '<p class="subtle">No matching tables</p>';
  }
  function selectTable(name, focus = false, fit = false) {
    if (!tables[name]) return;
    state.selected = name; state.focus = focus;
    if (state.view !== 'schema') setView('schema');
    renderGraph(fit || focus); renderInspector(); updateNavigation();
  }
  function selectDomain(id) {
    if (!domains[id] && id !== 'all') return;
    state.domain = id; state.focus = false; state.selected = null;
    $('#table-search').value = '';
    setView('schema'); renderGraph(true); renderInspector(); updateNavigation();
  }
  function shownTables() {
    if (state.focus && state.selected) {
      const ids = new Set([state.selected]);
      for (const r of data.relations) if (r.from === state.selected || r.to === state.selected) { ids.add(r.from); ids.add(r.to); }
      return data.tables.filter(t => ids.has(t.name));
    }
    return data.tables.filter(t => state.domain === 'all' || t.domain === state.domain);
  }
  function diagramColumns(t) {
    return state.allColumns ? t.columns : t.columns.filter(c => c.pk || c.reference || c.unique || ['status', 'quantity', 'total_minor', 'on_hand', 'reserved', 'allocated'].includes(c.name));
  }
  function layoutNodes(list) {
    const nodes = new Map();
    const width = 276, rowHeight = 25;
    const place = (t, x, y) => { const cols = diagramColumns(t); nodes.set(t.name, { table: t, x, y, width, height: 54 + cols.length * rowHeight + 25, columns: cols }); };
    if (state.focus && state.selected) {
      const parents = new Set(data.relations.filter(r => r.from === state.selected && r.to !== state.selected).map(r => r.to));
      const groups = [list.filter(t => parents.has(t.name)), list.filter(t => t.name === state.selected), list.filter(t => t.name !== state.selected && !parents.has(t.name))];
      groups.forEach((group, i) => { let y = 45; group.forEach(t => { place(t, 35 + i * 390, y); y += nodes.get(t.name).height + 65; }); });
    } else if (state.domain === 'all') {
      data.domains.forEach((d, i) => { let y = 65; list.filter(t => t.domain === d.id).forEach(t => { place(t, 35 + i * 385, y); y += nodes.get(t.name).height + 65; }); });
    } else {
      const lanes = [40, 40, 40];
      list.forEach(t => { const i = lanes.indexOf(Math.min(...lanes)); place(t, 35 + i * 390, lanes[i]); lanes[i] += nodes.get(t.name).height + 75; });
    }
    state.bounds = { width: Math.max(...[...nodes.values()].map(n => n.x + n.width)) + 70, height: Math.max(...[...nodes.values()].map(n => n.y + n.height)) + 60 };
    return nodes;
  }
  function edgePath(a, b, r) {
    const indexA = a.columns.findIndex(c => c.name === r.column), indexB = b.columns.findIndex(c => c.name === r.target);
    const ya = a.y + 66 + Math.max(indexA, 0) * 25, yb = b.y + 66 + Math.max(indexB, 0) * 25;
    if (a === b) return `M${a.x+a.width},${ya} C${a.x+a.width+65},${ya} ${b.x+b.width+65},${yb-40} ${b.x+b.width},${yb}`;
    const right = b.x >= a.x + a.width / 2;
    const xa = a.x + (right ? a.width : 0), xb = b.x + (right ? 0 : b.width);
    const offset = Math.max(55, Math.abs(xb - xa) * .48);
    return `M${xa},${ya} C${xa+(right?offset:-offset)},${ya} ${xb+(right?-offset:offset)},${yb} ${xb},${yb}`;
  }
  function renderGraph(reset = true) {
    const list = shownTables(), nodes = layoutNodes(list);
    const relations = data.relations.filter(r => nodes.has(r.from) && nodes.has(r.to));
    $('#graph-title').textContent = state.focus ? `${state.selected} · connections` : state.domain === 'all' ? 'Complete database' : domains[state.domain].title;
    $('#graph-count').textContent = `${list.length} tables · ${relations.length} visible FK`;
    $('#clear-focus').hidden = state.domain === 'all' && !state.focus && !state.selected;
    $('#overview-hint').hidden = state.domain !== 'all' || state.focus;
    let svg = '';
    if (state.domain === 'all' && !state.focus) svg += data.domains.map((d,i) => `<text x="${35+i*385}" y="30" fill="${d.color}" font-family="Segoe UI,Arial,sans-serif" font-size="14" font-weight="600">${esc(d.title)}</text>`).join('');
    svg += relations.map(r => `<path class="schema-edge ${r.from === state.selected || r.to === state.selected ? 'focused' : ''}" d="${edgePath(nodes.get(r.from),nodes.get(r.to),r)}" marker-end="url(#fk-arrow)"><title>${esc(`${r.from}.${r.column} → ${r.to}.${r.target} | ${r.cardinality} | DELETE ${r.onDelete}`)}</title></path>`).join('');
    for (const n of nodes.values()) {
      const t = n.table, d = domains[t.domain], selected = state.selected === t.name;
      svg += `<g class="schema-node node-shadow" role="button" tabindex="0" data-node="${t.name}" aria-label="Inspect ${t.name}, ${t.columns.length} columns" transform="translate(${n.x},${n.y})"><title>${esc(t.constraints)}</title><rect class="node-border" width="${n.width}" height="${n.height}" rx="8" fill="#fff" stroke="${selected ? d.color : '#d9e3d4'}" stroke-width="${selected ? 2 : 1}"/><path d="M8 0H${n.width-8}Q${n.width} 0 ${n.width} 8V43H0V8Q0 0 8 0" fill="${d.color}12"/><rect x="0" y="8" width="3" height="27" rx="1.5" fill="${d.color}"/><text x="14" y="26" font-family="Consolas,monospace" font-size="12" font-weight="600" fill="#354b36">${t.name}</text><line x1="0" y1="43" x2="${n.width}" y2="43" stroke="#e6ece1"/>`;
      n.columns.forEach((c,i) => {
        const y = 67 + i * 25, key = c.pk ? 'PK' : c.reference ? 'FK' : c.unique ? 'UQ' : '·';
        const color = c.pk ? '#a48b37' : c.reference ? '#4d9277' : c.unique ? '#8b78b5' : '#b1baaa';
        const background = c.pk ? '#f8f2dd' : c.reference ? '#eaf4ed' : '#f1f1f6';
        svg += `<rect x="11" y="${y-12}" width="24" height="16" rx="3" fill="${background}"/><text x="23" y="${y}" text-anchor="middle" font-family="Consolas,monospace" font-size="8" fill="${color}">${key}</text><text x="43" y="${y}" font-family="Consolas,monospace" font-size="10" fill="#5b6e53">${c.name}</text><text x="${n.width-12}" y="${y}" text-anchor="end" font-family="Consolas,monospace" font-size="8" fill="#a4af9b">${c.nullable ? '?' : ''} ${c.type === 'timestamptz' ? 'time' : c.type}</text>`;
      });
      svg += `<text x="13" y="${n.height-10}" font-family="Segoe UI,Arial,sans-serif" font-size="8" fill="#a1ae96">${t.columns.length} columns · ${t.columns.filter(c=>c.reference).length} foreign keys</text><text x="${n.width-13}" y="${n.height-10}" text-anchor="end" font-family="Segoe UI,Arial,sans-serif" font-size="8" fill="${d.color}">${esc(d.title)}</text></g>`;
    }
    $('#diagram-transform').innerHTML = svg;
    if (reset) requestAnimationFrame(fitGraph); else applyTransform();
  }
  function fitGraph() {
    if (state.view !== 'schema') return;
    const box = $('#diagram-canvas').getBoundingClientRect();
    if (!box.width || !box.height) return;
    state.scale = Math.min(1.2, Math.max(.05, Math.min((box.width-40)/state.bounds.width,(box.height-45)/state.bounds.height)));
    state.x = (box.width - state.bounds.width*state.scale)/2;
    state.y = Math.max(12,(box.height-state.bounds.height*state.scale)/2);
    applyTransform();
  }
  function applyTransform() { $('#diagram-transform').setAttribute('transform',`translate(${state.x} ${state.y}) scale(${state.scale})`); $('#zoom-value').textContent = `${Math.round(state.scale*100)}%`; }
  function zoom(factor, x, y) {
    const box = $('#diagram-canvas').getBoundingClientRect();
    x ??= box.width/2; y ??= box.height/2;
    const next = Math.min(2.5, Math.max(.04,state.scale*factor));
    state.x = x-(x-state.x)*next/state.scale; state.y = y-(y-state.y)*next/state.scale; state.scale=next; applyTransform();
  }
  function renderInspector() {
    const t = tables[state.selected];
    if (!t) {
      $('#inspector').innerHTML = `<div class="inspector-kicker">SCHEMA EXPLORER <span>↗</span></div><div class="inspector-empty"><div class="inspector-empty-icon">⌘</div><h2>Follow a connection.</h2><p class="inspector-intro">Select any table to inspect every specified column, its keys, inbound references and suggested indexes.</p><div class="starter-links">${['orders','product_variants','inventory_balances','payment_attempts','refunds','users'].map(name=>`<button data-table="${name}">${name} <span>→</span></button>`).join('')}</div><div class="inspector-section">READING THE GRAPH</div><p class="inspector-rule">Arrows point from the FK column to its referenced key. A <b>?</b> marks nullable columns. Use the Foreign keys view for full cardinalities and delete policies.</p></div>`; return;
    }
    const outgoing=data.relations.filter(r=>r.from===t.name),incoming=data.relations.filter(r=>r.to===t.name);
    const relationCard=(r,inbound)=>`<button class="relation-card" data-related="${inbound?r.from:r.to}"><code>${esc(inbound?`${r.from}.${r.column}`:`${r.column}`)}</code><code>→ ${esc(inbound?`${r.to}.${r.target}`:`${r.to}.${r.target}`)}</code><small>${esc(r.cardinality)} · DELETE ${r.onDelete}</small></button>`;
    $('#inspector').innerHTML = `<div class="inspector-kicker">TABLE DETAIL <button class="quiet-button" data-action="clear-selection">×</button></div><h2>${t.name}</h2><span class="domain-badge">${domains[t.domain].title}</span><p class="inspector-intro">${t.columns.length} specified columns · ${outgoing.length} outgoing · ${incoming.length} incoming FK</p><button class="download-button" data-action="focus">Focus connections ↗</button><div class="inspector-section">COLUMNS <span>${t.columns.length}</span></div>${t.columns.map(c=>`<div class="column-row"><span class="${c.pk?'key-pill':c.reference?'fk-pill':'uk-pill'}">${c.pk?'PK':c.reference?'FK':c.unique?'UQ':'·'}</span><span class="col-name">${c.name}${c.pk&&c.reference?' <b class="fk-pill">FK</b>':''}</span>${c.nullable?'<span class="null-badge">NULL</span>':''}<span class="col-type">${c.type}</span></div>`).join('')}<div class="inspector-section">CONSTRAINTS</div><div class="inspector-rule">${esc(t.constraints)}</div>${t.uniques.length?`<div class="inspector-section">UNIQUE KEYS</div>${t.uniques.map(u=>`<div class="inspector-index">UNIQUE (${u.join(', ')})</div>`).join('')}`:''}${outgoing.length?`<div class="inspector-section">REFERENCES <span>${outgoing.length}</span></div>${outgoing.map(r=>relationCard(r,false)).join('')}`:''}${incoming.length?`<div class="inspector-section">REFERENCED BY <span>${incoming.length}</span></div>${incoming.map(r=>relationCard(r,true)).join('')}`:''}${data.logical.filter(r=>r.table===t.name).map(r=>`<div class="inspector-section">LOGICAL REFERENCE</div><div class="inspector-rule"><code>${r.column}</code> → ${esc(r.target)}<br>${esc(r.reason)}</div>`).join('')}<div class="inspector-section">INDEX CANDIDATES <span>${t.indexes.length}</span></div>${t.indexes.length?t.indexes.map(i=>`<div class="inspector-index">${esc(i.sql)}</div>`).join(''):'<p class="inspector-intro">Primary/unique keys cover the specified access path. Add further indexes only for measured queries.</p>'}`;
  }
  function renderRelations() {
    $('#view-relations').innerHTML=`<div class="content-card"><h2>${data.relations.length} real foreign key edges</h2><p>Arrows run from child FK to parent key. Children are optional on the parent side; nullable controls whether a child may omit its parent. RESTRICT preserves referenced records; CASCADE is reserved for dependent rows.</p><div class="filter-bar"><input id="relation-search" type="search" placeholder="Search table, FK column or referenced key…" aria-label="Search foreign keys"><select id="relation-domain" aria-label="Source domain"><option value="all">All source domains</option>${data.domains.map(d=>`<option value="${d.id}">${d.title}</option>`).join('')}</select><span class="subtle" id="relation-count"></span></div><div class="scroll-table"><table><thead><tr><th>Child foreign key</th><th>Referenced key</th><th>Cardinality</th><th>Delete / update</th></tr></thead><tbody id="relation-body"></tbody></table></div></div><div class="content-card"><h2>Logical references are not foreign keys</h2><p>These references select their target by operation/entity type. Snapshot JSON and provider identifiers are not drawn as invented SQL foreign keys.</p><div class="scroll-table"><table><thead><tr><th>Column</th><th>Logical target</th><th>Integrity rule</th></tr></thead><tbody>${data.logical.map(r=>`<tr><td><button class="text-link" data-table="${r.table}"><code>${r.table}.${r.column}</code></button></td><td>${esc(r.target)}</td><td>${esc(r.reason)}</td></tr>`).join('')}</tbody></table></div></div>`;
    const filter=()=>{
      const q=$('#relation-search').value.toLowerCase(),domain=$('#relation-domain').value;
      const rows=data.relations.filter(r=>(domain==='all'||tables[r.from].domain===domain)&&`${r.from}.${r.column} ${r.to}.${r.target}`.includes(q));
      $('#relation-count').textContent=`${rows.length} of ${data.relations.length} relations`;
      $('#relation-body').innerHTML=rows.map(r=>`<tr><td><button class="text-link relation-path" data-table="${r.from}"><code>${r.from}.${r.column}</code></button><span class="nullable-label">${r.nullable?'Nullable':'Required'}${r.unique?' · Unique FK':''}</span></td><td><button class="text-link relation-path" data-table="${r.to}"><code>${r.to}.${r.target}</code></button></td><td>${esc(r.cardinality)}</td><td><code>${r.onDelete} / ${r.onUpdate}</code></td></tr>`).join('')||'<tr><td colspan="4">No matching relationships.</td></tr>';
    };
    $('#relation-search').addEventListener('input',filter);$('#relation-domain').addEventListener('change',filter);filter();
  }
  function renderOptimization() {
    $('#view-optimization').innerHTML=`<div class="optimization-grid">${data.optimize.map(o=>`<article class="optimization-card"><span>${esc(o.label)}</span><h3>${esc(o.title)}</h3><p>${esc(o.body)}</p></article>`).join('')}</div><div class="content-card"><h2>Index candidates, with a reason</h2><p>${data.indexes.filter(i=>i.kind==='workload').length} workload/constraint indexes plus ${data.indexes.filter(i=>i.kind==='fk').length} FK access-path candidates. This is a review catalog, not a recommendation to install every index. PK/UNIQUE-backed indexes already exist when those constraints are created.</p><div class="filter-bar"><input id="index-search" type="search" placeholder="Find an index by table, column or use case…" aria-label="Find index candidate"><select id="index-kind" aria-label="Index category"><option value="workload">Workload & constraint indexes</option><option value="fk">Foreign key access paths</option><option value="all">All index candidates</option></select><a href="index-candidates.sql" download class="quiet-button">Download SQL ↓</a></div><div id="index-list"></div></div><div class="content-card"><h2>Validate on representative data</h2><p>Use a safe SELECT in staging. Compare row estimates, actual rows, buffers and execution time with matching filters. Adding an index does not guarantee the planner will use it.</p><pre class="inspector-index">EXPLAIN (ANALYZE, BUFFERS)
SELECT id, order_number, status, total_minor
FROM orders
WHERE customer_id = :customer_id
  AND (created_at, id) &lt; (:cursor_time, :cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;</pre><p>The named placeholders are illustrative bound parameters. No speedup or query runtime has been measured for this unimplemented schema.</p><div class="source-links">${data.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noreferrer">${s.title} ↗</a>`).join('')}</div></div>`;
    const filter=()=>{
      const q=$('#index-search').value.toLowerCase(),kind=$('#index-kind').value;
      const rows=data.indexes.filter(i=>(kind==='all'||kind===i.kind)&&`${i.table} ${i.title} ${i.expression}`.toLowerCase().includes(q));
      $('#index-list').innerHTML=rows.map(i=>`<article class="sql-card"><header><div><h3>${esc(i.title)}</h3><span class="subtle">${i.table}${i.unique?' · UNIQUE constraint':''}</span></div><button class="quiet-button" data-copy-index="${i.name}">Copy SQL</button></header><p>${esc(i.reason)}</p><pre><code>${esc(i.sql)}</code></pre></article>`).join('')||'<p class="subtle">No matching index candidates.</p>';
    };
    $('#index-search').addEventListener('input',filter);$('#index-kind').addEventListener('change',filter);filter();
  }
  function renderArchitecture() {
    $('#view-architecture').innerHTML=`<div class="diagram-tabs">${data.diagrams.map((d,i)=>`<button class="diagram-tab ${i===state.diagram?'active':''}" data-diagram="${i}">${String(i+1).padStart(2,'0')} ${esc(d.title)}</button>`).join('')}</div><div class="content-card"><div class="architecture-controls"><strong id="architecture-title"></strong><button class="quiet-button" id="architecture-smaller">Zoom −</button><button class="quiet-button" id="architecture-larger">Zoom +</button><a class="quiet-button" id="architecture-source" target="_blank">Mermaid source ↗</a><a class="quiet-button" id="architecture-download" download>SVG ↓</a></div><div class="architecture-stage" id="architecture-stage"></div></div>`;
    showArchitecture(state.diagram);
    $('#architecture-smaller').onclick=()=>scaleArchitecture(.8);$('#architecture-larger').onclick=()=>scaleArchitecture(1.25);
  }
  let architectureScale=1;
  function showArchitecture(index) {
    state.diagram=index;const d=data.diagrams[index];
    $$('[data-diagram]').forEach(el=>el.classList.toggle('active',Number(el.dataset.diagram)===index));
    $('#architecture-title').textContent=d.title;$('#architecture-stage').innerHTML=d.svg;
    $('#architecture-source').href=`../diagrams/${d.file.replace('.svg','.mmd')}`;
    $('#architecture-download').href=`../diagrams/${d.file}`;
    const svg=$('#architecture-stage svg'),box=svg.viewBox.baseVal;
    svg.dataset.nativeWidth=box.width;svg.dataset.nativeHeight=box.height;
    architectureScale=Math.min(1,($('#architecture-stage').clientWidth-50)/box.width);scaleArchitecture(1);
  }
  function scaleArchitecture(factor) {
    architectureScale=Math.max(.12,Math.min(2.5,architectureScale*factor));
    const svg=$('#architecture-stage svg');if(!svg)return;
    svg.style.setProperty('width',`${Number(svg.dataset.nativeWidth)*architectureScale}px`,'important');svg.style.height=`${Number(svg.dataset.nativeHeight)*architectureScale}px`;
  }
  function renderApi() {
    $('#view-api').innerHTML=`<div class="content-card"><h2>${data.endpoints.length} endpoint contracts</h2><p>Human-readable proposed contracts. Browser paths use a same-origin /api/v1 proxy; server paths begin /v1. Permission and ownership checks run on the server.</p><div class="filter-bar"><input id="api-search" type="search" placeholder="Search route, permission or behavior…" aria-label="Search API contract"><select id="api-method" aria-label="HTTP method"><option value="all">All methods</option>${['GET','POST','PUT','PATCH','DELETE'].map(m=>`<option>${m}</option>`).join('')}</select><span id="api-count" class="subtle"></span></div><div class="scroll-table"><table><thead><tr><th>Method</th><th>Route</th><th>Access / permission</th><th>Behavior</th></tr></thead><tbody id="api-body"></tbody></table></div></div>`;
    const filter=()=>{const q=$('#api-search').value.toLowerCase(),method=$('#api-method').value;const rows=data.endpoints.filter(e=>(method==='all'||e.method===method)&&`${e.path} ${e.access} ${e.description}`.toLowerCase().includes(q));$('#api-count').textContent=`${rows.length} contracts`;$('#api-body').innerHTML=rows.map(e=>`<tr><td><span class="method ${e.method}">${e.method}</span></td><td><code>${esc(e.path)}</code></td><td class="api-access">${esc(e.access)}</td><td>${esc(e.description)}</td></tr>`).join('')||'<tr><td colspan="4">No matching endpoint.</td></tr>';};
    $('#api-search').addEventListener('input',filter);$('#api-method').addEventListener('change',filter);filter();
  }
  function inlineMarkdown(s) {
    return esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/!?\[([^\]]+)\]\((https?:\/\/[^\s)]+|[^\s]+\.md|[^\s]+\.svg)\)/g,(_,label,href)=>`<a href="${href.startsWith('http')?href:'../'+href}" target="_blank" rel="noreferrer">${label} ↗</a>`);
  }
  function documentHtml(markdown) {
    const lines=markdown.split(/\r?\n/);let html='',code=null,list=false;
    const closeList=()=>{if(list){html+='</ul>';list=false;}};
    for(let i=0;i<lines.length;i++){
      const line=lines[i];if(line.startsWith('```')){closeList();if(code!==null){html+=`<pre><code>${esc(code.join('\n'))}</code></pre>`;code=null;}else code=[];continue;}
      if(code!==null){code.push(line);continue;}
      if(line.startsWith('|')&&lines[i+1]?.match(/^\|\s*[-:]/)){
        closeList();const cells=l=>l.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
        html+='<div class="scroll-table"><table><thead><tr>'+cells(line).map(c=>`<th>${inlineMarkdown(c)}</th>`).join('')+'</tr></thead><tbody>';i++;
        while(lines[i+1]?.startsWith('|'))html+='<tr>'+cells(lines[++i]).map(c=>`<td>${inlineMarkdown(c)}</td>`).join('')+'</tr>';
        html+='</tbody></table></div>';continue;
      }
      if(/^#{1,4} /.test(line)){closeList();const level=line.match(/^#+/)[0].length;html+=`<h${level}>${inlineMarkdown(line.slice(level+1))}</h${level}>`;}
      else if(/^[-*] /.test(line)){if(!list){html+='<ul>';list=true;}html+=`<li>${inlineMarkdown(line.slice(2))}</li>`;}
      else if(line.trim()){closeList();html+=`<p>${inlineMarkdown(line)}</p>`;}else closeList();
    }
    closeList();return html;
  }
  function renderDocuments() {
    $('#view-documents').innerHTML=`<div class="doc-tabs">${data.documents.map((d,i)=>`<button data-document="${i}">${esc(d.title.replace(/^MyShop /,''))}</button>`).join('')}</div><article class="content-card document-content" id="document-body"></article>`;showDocument(data.documents.findIndex(d=>d.file==='BACKEND-SYSTEM-DESIGN.md'));
  }
  function showDocument(index) {const d=data.documents[index];$$('[data-document]').forEach(el=>el.classList.toggle('active',Number(el.dataset.document)===index));$('#document-body').innerHTML=documentHtml(d.markdown);}
  function downloadSvg() {
    const clone=$('#schema-svg').cloneNode(true);clone.setAttribute('width',state.bounds.width);clone.setAttribute('height',state.bounds.height);clone.setAttribute('viewBox',`0 0 ${state.bounds.width} ${state.bounds.height}`);clone.querySelector('#diagram-transform').removeAttribute('transform');
    const style=document.createElementNS('http://www.w3.org/2000/svg','style');style.textContent='.schema-edge{fill:none;stroke:#77a08d;stroke-width:1.2;opacity:.65}.schema-edge.focused{stroke:#28795f;stroke-width:2;opacity:1}';clone.insertBefore(style,clone.firstChild);
    const uri=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=uri;a.download=`myshop-${state.focus?state.selected:state.domain}-schema.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(uri),2000);toast('Diagram SVG exported');
  }
  $('#stat-tables').textContent=data.tables.length;$('#stat-columns').textContent=data.tables.reduce((n,t)=>n+t.columns.length,0);$('#stat-fks').textContent=data.relations.length;
  $('#nav-table-count').textContent=data.tables.length;$('#all-count').textContent=data.tables.length;
  $('#domain-list').innerHTML=data.domains.map(d=>`<button class="domain-item" data-domain="${d.id}"><span class="domain-dot" style="background:${d.color}"></span>${d.title}<small>${data.tables.filter(t=>t.domain===d.id).length}</small></button>`).join('');
  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-view]');if(nav){setView(nav.dataset.view);return;}
    const domain=event.target.closest('[data-domain]');if(domain){selectDomain(domain.dataset.domain);return;}
    const table=event.target.closest('[data-table]');if(table){selectTable(table.dataset.table,true,true);$('.sidebar').classList.remove('open');return;}
    const related=event.target.closest('[data-related]');if(related){selectTable(related.dataset.related,true,true);return;}
    const diagram=event.target.closest('[data-diagram]');if(diagram){showArchitecture(Number(diagram.dataset.diagram));return;}
    const doc=event.target.closest('[data-document]');if(doc){showDocument(Number(doc.dataset.document));return;}
    const copy=event.target.closest('[data-copy-index]');if(copy){copyText(data.indexes.find(i=>i.name===copy.dataset.copyIndex).sql);return;}
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='focus'){state.focus=true;renderGraph(true);updateNavigation();}
    if(action==='clear-selection'){state.selected=null;state.focus=false;renderGraph(true);renderInspector();updateNavigation();}
  });
  $('#table-search').oninput=renderTableList;
  $('#all-columns').onchange=event=>{state.allColumns=event.target.checked;renderGraph(true);};
  $('#clear-focus').onclick=()=>selectDomain('all');$('#start-orders').onclick=()=>{selectDomain('orders');selectTable('orders');};
  $('#fit-graph').onclick=fitGraph;$('#zoom-in').onclick=()=>zoom(1.25);$('#zoom-out').onclick=()=>zoom(.8);$('#export-svg').onclick=downloadSvg;
  $('#print-button').onclick=()=>window.print();$('#mobile-menu').onclick=()=>$('.sidebar').classList.toggle('open');
  $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('.diagram-wrap').requestFullscreen();}catch{toast('Fullscreen is unavailable in this browser');}};
  document.addEventListener('fullscreenchange',()=>requestAnimationFrame(fitGraph));
  let drag=null,suppressClick=false;
  $('#diagram-canvas').addEventListener('pointerdown',event=>{if(event.button!==0||event.target.closest('[data-node]'))return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,tx:state.x,ty:state.y,moved:false};event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.classList.add('dragging');});
  $('#diagram-canvas').addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;state.x=drag.tx+dx;state.y=drag.ty+dy;applyTransform();});
  const endDrag=()=>{if(drag)suppressClick=drag.moved;drag=null;$('#diagram-canvas').classList.remove('dragging');setTimeout(()=>suppressClick=false,0);};
  $('#diagram-canvas').addEventListener('pointerup',endDrag);$('#diagram-canvas').addEventListener('pointercancel',endDrag);
  $('#diagram-canvas').addEventListener('click',event=>{const node=event.target.closest('[data-node]');if(node&&!suppressClick)selectTable(node.dataset.node,state.focus,false);});
  $('#diagram-canvas').addEventListener('keydown',event=>{const node=event.target.closest('[data-node]');if(node&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectTable(node.dataset.node,state.focus,false);}else if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.25);}else if(event.key==='-'){event.preventDefault();zoom(.8);}else if(event.key==='0'){event.preventDefault();fitGraph();}});
  $('#diagram-canvas').addEventListener('wheel',event=>{event.preventDefault();const box=event.currentTarget.getBoundingClientRect();zoom(event.deltaY<0?1.1:1/1.1,event.clientX-box.left,event.clientY-box.top);},{passive:false});
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();$('#table-search').focus();}if(event.key==='Escape')$('.sidebar').classList.remove('open');});
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fitGraph,100);});
  renderGraph();renderInspector();updateNavigation();renderRelations();renderOptimization();renderArchitecture();renderApi();renderDocuments();
  setView(location.hash.slice(1)||'schema',false);
  window.MYSHOP_ATLAS_UI={state,selectDomain,selectTable,setView,fitGraph};
})();
