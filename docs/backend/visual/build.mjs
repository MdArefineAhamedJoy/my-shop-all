import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Rebuild the offline atlas from the reviewed database dictionary.
// This is documentation metadata, not a deployed database migration.
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const markdown = fs.readFileSync(path.join(root, 'DATABASE-DESIGN.md'), 'utf8');
const domains = [
  { id: 'identity', title: 'Identity & access', color: '#5574b9', section: 'Identity and customer data' },
  { id: 'catalog', title: 'Catalog & media', color: '#308a75', section: 'Catalog and merchandising' },
  { id: 'inventory', title: 'Inventory', color: '#bd7a32', section: 'Inventory' },
  { id: 'shopping', title: 'Cart & pricing', color: '#9270b2', section: 'Shopping and pricing' },
  { id: 'orders', title: 'Orders & shipping', color: '#367fa1', section: 'Orders and fulfillment' },
  { id: 'payments', title: 'Payments & finance', color: '#b7636c', section: 'Payment and refunds' },
  { id: 'returns', title: 'Returns & documents', color: '#9d8251', section: 'Returns and documents' },
  { id: 'platform', title: 'Content & platform', color: '#6d8a5c', section: 'Content and platform support' },
];
const primary = {
  role_permissions: ['role_id', 'permission_id'], user_roles: ['user_id', 'role_id'],
  customer_profiles: ['user_id'], product_slug_aliases: ['old_slug'],
  product_tags: ['product_id', 'tag_id'], collection_products: ['collection_id', 'product_id'],
  inventory_balances: ['variant_id'], wishlist_items: ['customer_id', 'product_id'],
  shipment_items: ['shipment_id', 'order_item_id'], order_payment_summaries: ['order_id'],
  refund_items: ['refund_id', 'order_item_id'], return_evidence: ['return_item_id', 'asset_id'],
  consumer_receipts: ['consumer_name', 'event_id'], daily_sales_rollups: ['business_date', 'currency', 'metric_version'],
};
const uniques = {
  users: [['email_normalized']], roles: [['code']], permissions: [['code']],
  staff_invitations: [['token_digest']], sessions: [['secret_digest']],
  auth_challenges: [['reset_token_digest']], mfa_recovery_codes: [['digest']],
  categories: [['slug']], products: [['slug']],
  product_variants: [['sku'], ['product_id', 'size_code', 'color_code']],
  media_assets: [['object_key']], tags: [['slug']], collections: [['slug']],
  inventory_reservations: [['order_item_id']],
  inventory_movements: [['source_type', 'source_id', 'variant_id', 'effect_code']],
  carts: [['guest_secret_digest']], cart_items: [['cart_id', 'variant_id']],
  promotion_rules: [['code_normalized']], promotion_claims: [['order_id']],
  pricing_policy_versions: [['revision']], orders: [['order_number'], ['quote_id']],
  order_items: [['order_id', 'variant_id']], guest_order_capabilities: [['secret_digest']],
  order_status_events: [['source_event_id']], shipments: [['order_id'], ['courier_code', 'external_reference']],
  shipment_events: [['shipment_id', 'provider_event_id']],
  payment_attempts: [['operation_key'], ['provider_code', 'merchant_account_ref', 'provider_reference']],
  payment_captures: [['attempt_id'], ['provider_capture_ref']],
  provider_inbox: [['provider_code', 'merchant_account_ref', 'dedupe_key']],
  refunds: [['operation_key']], financial_events: [['source_type', 'source_id', 'kind']],
  return_items: [['return_request_id', 'order_item_id']], documents: [['document_number']],
  storefront_revisions: [['revision']], newsletter_subscriptions: [['email_normalized']],
  idempotency_records: [['principal_scope', 'operation', 'key']], background_tasks: [['operation_key']],
};
// Every tuple is an actual proposed FK; polymorphic references are separate.
const refs = {
  role_permissions: { role_id: 'roles.id', permission_id: 'permissions.id' },
  user_roles: { user_id: 'users.id', role_id: 'roles.id', granted_by: 'users.id' },
  staff_invitations: { intended_role_id: 'roles.id', invited_by: 'users.id' },
  sessions: { user_id: 'users.id' }, auth_challenges: { user_id: 'users.id' },
  mfa_credentials: { user_id: 'users.id' }, mfa_recovery_codes: { user_id: 'users.id' },
  customer_profiles: { user_id: 'users.id' }, addresses: { customer_id: 'users.id' },
  categories: { parent_id: 'categories.id' }, products: { category_id: 'categories.id' },
  product_slug_aliases: { product_id: 'products.id' }, product_variants: { product_id: 'products.id' },
  media_assets: { uploaded_by: 'users.id' },
  product_media: { product_id: 'products.id', variant_id: 'product_variants.id', asset_id: 'media_assets.id' },
  product_tags: { product_id: 'products.id', tag_id: 'tags.id' },
  collection_products: { collection_id: 'collections.id', product_id: 'products.id' },
  inventory_balances: { variant_id: 'product_variants.id' },
  inventory_reservations: { order_id: 'orders.id', order_item_id: 'order_items.id', variant_id: 'product_variants.id' },
  inventory_movements: { variant_id: 'product_variants.id', reservation_id: 'inventory_reservations.id', actor_id: 'users.id' },
  carts: { customer_id: 'users.id' }, cart_items: { cart_id: 'carts.id', variant_id: 'product_variants.id' },
  wishlist_items: { customer_id: 'users.id', product_id: 'products.id' },
  checkout_quotes: { customer_id: 'users.id', cart_id: 'carts.id', rules_version: 'pricing_policy_versions.revision' },
  promotion_claims: { promotion_id: 'promotion_rules.id', quote_id: 'checkout_quotes.id', order_id: 'orders.id', customer_id: 'users.id' },
  pricing_policy_versions: { published_by: 'users.id' },
  orders: { customer_id: 'users.id', placed_by_staff_id: 'users.id', quote_id: 'checkout_quotes.id', rules_version: 'pricing_policy_versions.revision' },
  order_items: { order_id: 'orders.id', variant_id: 'product_variants.id', product_id: 'products.id' },
  guest_order_capabilities: { order_id: 'orders.id', claimed_by: 'users.id' },
  order_status_events: { order_id: 'orders.id', actor_id: 'users.id' },
  order_notes: { order_id: 'orders.id', actor_id: 'users.id' }, shipments: { order_id: 'orders.id' },
  shipment_items: { shipment_id: 'shipments.id', order_item_id: 'order_items.id' },
  shipment_events: { shipment_id: 'shipments.id' }, order_payment_summaries: { order_id: 'orders.id' },
  payment_attempts: { order_id: 'orders.id' }, payment_captures: { order_id: 'orders.id', attempt_id: 'payment_attempts.id' },
  cod_collections: { order_id: 'orders.id', shipment_id: 'shipments.id', evidence_asset_id: 'media_assets.id', recorded_by: 'users.id' },
  refunds: { order_id: 'orders.id', capture_id: 'payment_captures.id', cod_collection_id: 'cod_collections.id', return_request_id: 'return_requests.id', approved_by: 'users.id' },
  refund_items: { refund_id: 'refunds.id', order_item_id: 'order_items.id' },
  financial_events: { order_id: 'orders.id' },
  return_requests: { order_id: 'orders.id', requested_by: 'users.id', approved_by: 'users.id' },
  return_items: { return_request_id: 'return_requests.id', order_item_id: 'order_items.id' },
  return_evidence: { return_item_id: 'return_items.id', asset_id: 'media_assets.id' },
  documents: { order_id: 'orders.id', refund_id: 'refunds.id' },
  storefront_revisions: { authored_by: 'users.id' },
  banners: { storefront_revision_id: 'storefront_revisions.id', desktop_asset_id: 'media_assets.id', mobile_asset_id: 'media_assets.id' },
  store_settings: { active_storefront_revision_id: 'storefront_revisions.id', active_pricing_policy_id: 'pricing_policy_versions.id' },
  consent_events: { customer_id: 'users.id' }, consumer_receipts: { event_id: 'outbox_events.id' },
  audit_logs: { actor_id: 'users.id' }, report_jobs: { requested_by: 'users.id' },
};
const cascade = new Set(['sessions.user_id', 'mfa_credentials.user_id', 'mfa_recovery_codes.user_id', 'cart_items.cart_id', 'role_permissions.role_id', 'role_permissions.permission_id', 'user_roles.user_id', 'user_roles.role_id', 'product_tags.tag_id', 'product_tags.product_id', 'collection_products.collection_id', 'collection_products.product_id', 'wishlist_items.customer_id', 'wishlist_items.product_id', 'consumer_receipts.event_id']);
const logical = [
  { table: 'inventory_movements', column: 'source_id', target: 'Shipment / return / adjustment operation', reason: 'Polymorphic source. An effect-specific unique key prevents duplicate movement.' },
  { table: 'financial_events', column: 'source_id', target: 'Capture / collection / refund', reason: 'Polymorphic financial source, validated transactionally; not an SQL foreign key.' },
  { table: 'audit_logs', column: 'entity_id', target: 'Audited domain entity', reason: 'Entity type determines target. Preserve audit after retention/anonymization.' },
  { table: 'outbox_events', column: 'aggregate_id', target: 'Versioned domain aggregate', reason: 'Aggregate type selects target. Transactional event write, not a polymorphic FK.' },
  { table: 'background_tasks', column: 'entity_id', target: 'Task-specific domain entity', reason: 'Task kind selects aggregate; durable operation identity is unique.' },
  { table: 'idempotency_records', column: 'resource_id', target: 'Resulting command resource', reason: 'Operation-specific reference; no invented cross-table FK.' },
  { table: 'order_status_events', column: 'source_event_id', target: 'Provider / internal event', reason: 'Deduplicated event identity; may originate outside PostgreSQL.' },
  { table: 'consent_events', column: 'policy_revision', target: 'Versioned consent text', reason: 'External policy revision, distinct from commerce pricing policy.' },
];
const jsonFields = new Set(['marketing_preferences', 'notes_internal', 'size_guide', 'rule_json', 'lines_snapshot', 'address_snapshot', 'totals_snapshot', 'tax_config', 'shipping_config', 'shipping_snapshot', 'billing_snapshot', 'contact_snapshot', 'metadata_redacted', 'normalized_event', 'snapshot_json', 'public_config_json', 'internal_config', 'response_json', 'payload', 'changes_redacted', 'filters_json', 'counters_json']);
function typeOf(name, table) {
  if (['rules_version', 'revision', 'policy_revision'].includes(name)) return 'text';
  if (name === 'value') return 'integer';
  if (name === 'business_date') return 'date';
  if (name.endsWith('_at') || name.endsWith('_until')) return 'timestamptz';
  if (jsonFields.has(name)) return 'jsonb';
  if (name.endsWith('_minor')) return 'bigint';
  if (name === 'id' || name.endsWith('_id') || ['granted_by', 'invited_by', 'uploaded_by', 'published_by', 'claimed_by', 'recorded_by', 'approved_by', 'requested_by', 'authored_by'].includes(name)) return 'uuid';
  if (['active', 'is_default', 'is_featured', 'is_new'].includes(name)) return 'boolean';
  if (/quantity|^delta_|^on_hand$|^reserved$|^allocated$|^version$|_version$|^attempts$|^sort_order$|^byte_size$|^width$|^height$|^max_uses$|^per_customer_limit$|^row_count$|^last_counter$/.test(name)) return 'integer';
  return 'text';
}
let current;
const tables = [];
for (const line of markdown.split(/\r?\n/)) {
  if (line.startsWith('## ')) current = domains.find(d => d.section === line.slice(3));
  const match = line.match(/^\| `([a-z_]+)` \| (.*?) \| (.*?) \|$/);
  if (!match || !current) continue;
  const [, name, rawColumns, constraints] = match;
  const pk = primary[name] || ['id'];
  const columns = rawColumns.split(', ').map(raw => {
    const column = raw.split(' ')[0];
    return { name: column, type: typeOf(column, name), nullable: raw.includes('nullable'), pk: pk.includes(column), unique: (uniques[name] || []).some(u => u.length === 1 && u[0] === column), reference: refs[name]?.[column] || null };
  });
  // Common timestamps are standard conventions, not phantom undocumented FKs.
  tables.push({ name, domain: current.id, columns, primary: pk, uniques: uniques[name] || [], constraints, indexes: [] });
}
const byName = Object.fromEntries(tables.map(t => [t.name, t]));
const relations = [];
for (const table of tables) {
  for (const col of table.columns.filter(c => c.reference)) {
    const [targetTable, targetColumn] = col.reference.split('.');
    if (!byName[targetTable]?.columns.some(c => c.name === targetColumn)) throw new Error(`Invalid FK ${table.name}.${col.name}`);
    const target = byName[targetTable].columns.find(c => c.name === targetColumn);
    if (target.type !== col.type) throw new Error(`FK type mismatch ${table.name}.${col.name}`);
    const one = (table.primary.length === 1 && col.pk) || col.unique;
    relations.push({ from: table.name, column: col.name, to: targetTable, target: targetColumn, nullable: col.nullable, unique: one, cardinality: `${one ? '0..1' : '0..N'} children → ${col.nullable ? '0..1' : '1'} parent`, onDelete: cascade.has(`${table.name}.${col.name}`) ? 'CASCADE' : 'RESTRICT', onUpdate: 'RESTRICT' });
  }
}
for (const [table, columns] of Object.entries(refs)) for (const column of Object.keys(columns)) {
  if (!byName[table]?.columns.some(c => c.name === column)) throw new Error(`Missing FK column ${table}.${column}`);
}
const plans = [
  ['orders', 'Customer order history', '(customer_id, created_at DESC, id DESC)', '', 'Customer ownership + newest first; keyset cursor avoids deep OFFSET.'],
  ['orders', 'Fulfillment queue', '(status, created_at DESC, id DESC)', '', 'Staff status queue; stable order and bounded pages.'],
  ['order_items', 'Product cohort reporting', '(product_id, order_id)', '', 'Batch product sales joins; verify reporting workload before retaining.'],
  ['products', 'Published category listing', '(category_id, gender, published_at DESC, id DESC)', "status = 'published'", 'Published-only subset; category and gender equality precede newest-first order.'],
  ['products', 'Text search', "USING GIN (to_tsvector('simple', name || ' ' || description))", '', 'Query must use the identical expression/configuration. Test Bengali/English catalog relevance.'],
  ['product_variants', 'Active variant prices', '(price_minor, id)', 'active = true', 'Candidate for variant-level price range/sort. Measure joins to product publication filters.'],
  ['addresses', 'One default address', '(customer_id)', 'is_default = true', 'Unique partial constraint enforces one default per customer.', true],
  ['carts', 'One active customer cart', '(customer_id)', "state = 'active' AND customer_id IS NOT NULL", 'Unique active-cart invariant without blocking converted cart history.', true],
  ['inventory_reservations', 'Held reservation expiry', '(expires_at, id)', "state = 'held'", 'Small expiry scan; timestamp is checked again under transaction locks.'],
  ['payment_attempts', 'One unresolved attempt', '(order_id)', "status IN ('created','initializing','pending','unknown')", 'Unique partial constraint prevents parallel unresolved payment initialization.', true],
  ['payment_attempts', 'Provider reconciliation', '(status, initialized_at, id)', "status IN ('initializing','pending','unknown')", 'Bounded scans for unresolved provider attempts.'],
  ['payment_captures', 'One applied capture per order', '(order_id)', "disposition = 'applied'", 'Store duplicate/late captures as exceptions while applying one settlement.', true],
  ['outbox_events', 'Undispatched events', '(next_attempt_at, occurred_at, id)', 'dispatched_at IS NULL', 'Dispatcher claims bounded due batches; incomplete dispatched events need a separate recovery sweep.'],
  ['background_tasks', 'Due background tasks', '(next_attempt_at, id)', "state IN ('pending','retry')", 'Lease/retry workers scan only incomplete work.'],
  ['provider_inbox', 'Pending provider events', '(received_at, id)', "status IN ('pending','retry')", 'Inbox can drain without scanning all accepted callback history.'],
  ['sessions', 'Session expiry cleanup', '(absolute_expires_at, id)', 'revoked_at IS NULL', 'No volatile now() predicate; cleanup binds the cutoff timestamp.'],
  ['audit_logs', 'Entity audit trail', '(entity_type, entity_id, occurred_at DESC)', '', 'Investigate changes to one order/product.'],
  ['audit_logs', 'Actor audit trail', '(actor_id, occurred_at DESC)', '', 'Investigate privileged actions by one staff identity.'],
  ['return_requests', 'Return review queue', '(status, requested_at, id)', '', 'Queue-specific access with bounded time/status filters.'],
  ['financial_events', 'Settlement date report', '(occurred_at, kind)', '', 'Date-bounded financial reporting; rollups isolate repeated dashboard aggregation.'],
];
let indexNumber = 0;
const indexes = plans.map(([table, title, expression, predicate, reason, unique]) => {
  const name = `atlas_${table}_${++indexNumber}_idx`;
  const sql = `CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${name}\nON ${table} ${expression}${predicate ? `\nWHERE ${predicate}` : ''};`;
  const plan = { table, name, title, expression, predicate, unique: !!unique, reason, sql, kind: 'workload' };
  byName[table].indexes.push(plan);
  return plan;
});
// Cover FK lookups unless an unconditional PK/unique/workload index already starts with the column.
for (const relation of relations) {
  const table = byName[relation.from];
  const covered = table.primary[0] === relation.column || table.uniques.some(u => u[0] === relation.column) || table.indexes.some(i => !i.predicate && i.expression.startsWith(`(${relation.column},`)) || table.indexes.some(i => i.kind === 'fk' && i.column === relation.column);
  if (covered) continue;
  const name = `atlas_${table.name}_${relation.column}_fk`.slice(0, 63);
  const plan = { table: table.name, name, title: `FK lookup: ${relation.column}`, expression: `(${relation.column})`, predicate: '', unique: false, column: relation.column, reason: `Candidate for joins and parent-key checks through ${relation.column}. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.`, sql: `CREATE INDEX ${name} ON ${table.name} (${relation.column});`, kind: 'fk' };
  table.indexes.push(plan); indexes.push(plan);
}
const optimize = [
  { title: 'Normalize live state, snapshot purchased facts', label: 'Data model', body: 'Separate product, variant, inventory and order lines. Preserve historical price/address/SKU snapshots; avoid copying mutable product JSON into every cart item.' },
  { title: 'Protect stock inside PostgreSQL', label: 'Consistency', body: 'Lock one order, then balances in variant order. Conditional stock updates, reservation transitions and append-only movements commit together. Redis never decides inventory truth.' },
  { title: 'Put indexes behind real query shapes', label: 'Query plans', body: 'Review leading equality filters and stable sort keys. PK and UNIQUE already create supporting indexes. Referencing FK columns need an explicit access-path review; do not keep redundant indexes.' },
  { title: 'Keep the working set small', label: 'Partial indexes', body: 'Index held reservations and unresolved tasks with explicit stable predicates. Bind cutoff time in queries; do not put now() inside an index predicate.' },
  { title: 'Bound lists and batch relationships', label: 'API performance', body: 'Use keyset pagination for order/history queues. Fetch related order lines in bounded batches rather than one query per row. Limit bulk exports and stream them from a worker.' },
  { title: 'Measure before claiming a speedup', label: 'Validation', body: 'Compare EXPLAIN (ANALYZE, BUFFERS) on staging-sized data before/after an index. Record execution time, rows estimated/actual and buffer reads. No performance benchmark has been run for this proposed schema.' },
  { title: 'Maintain statistics and storage', label: 'Operations', body: 'Monitor autovacuum, dead tuples, table/index growth and pool saturation. Reassess hot-row contention before adding indexes. Partition append-only histories only when measured volume and retention justify it.' },
  { title: 'Cache published views, reconcile money', label: 'Read models', body: 'Cache public catalog/content with bounded TTL and outbox invalidation. Keep customer data private. Build dated rollups from financial facts and keep checkout/payment reads on the primary.' },
];
const documents = fs.readdirSync(root).filter(f => f.endsWith('.md')).map(file => ({ file, title: fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/)[0].replace(/^# /, ''), markdown: fs.readFileSync(path.join(root, file), 'utf8') }));
const diagrams = fs.readdirSync(path.join(root, 'diagrams')).filter(f => f.endsWith('.svg')).sort().map(file => ({ file, title: file.replace(/^\d+-/, '').replace('.svg', '').replaceAll('-', ' '), svg: fs.readFileSync(path.join(root, 'diagrams', file), 'utf8') }));
const apiText = fs.readFileSync(path.join(root, 'API-CONTRACT.md'), 'utf8');
const endpoints = [...apiText.matchAll(/^\| (GET|POST|PUT|PATCH|DELETE) `([^`]+)` \| ([^|]+) \| ([^|]+) \|/gm)].map(m => ({ method: m[1], path: m[2], access: m[3].trim(), description: m[4].trim() }));
const data = { title: 'MyShop Architecture Atlas', date: '21 October 2026', status: 'Proposed design', domains, tables, relations, logical, indexes, optimize, documents, diagrams, endpoints, sources: [
  { title: 'PostgreSQL constraints and foreign keys', url: 'https://www.postgresql.org/docs/current/ddl-constraints.html' },
  { title: 'PostgreSQL multicolumn indexes', url: 'https://www.postgresql.org/docs/current/indexes-multicolumn.html' },
  { title: 'PostgreSQL partial indexes', url: 'https://www.postgresql.org/docs/current/indexes-partial.html' },
  { title: 'PostgreSQL EXPLAIN', url: 'https://www.postgresql.org/docs/current/using-explain.html' },
] };
fs.writeFileSync(path.join(here, 'data.js'), `window.MYSHOP_ATLAS = ${JSON.stringify(data).replaceAll('<', '\\u003c')};\n`);
fs.writeFileSync(path.join(here, 'schema.json'), JSON.stringify({ ...data, documents: undefined, diagrams: undefined }, null, 2) + '\n');
fs.writeFileSync(path.join(here, 'index-candidates.sql'), '-- Proposed index candidates only. Not executed.\n-- Review existing PK/UNIQUE indexes, migration order, data and query plans first.\n-- CREATE INDEX CONCURRENTLY, if selected for production, runs outside a transaction.\n\n' + indexes.map(i => `-- ${i.title}: ${i.reason}\n${i.sql}`).join('\n\n') + '\n');
const er = ['erDiagram'];
for (const t of tables) {
  er.push(`    ${t.name} {`);
  for (const c of t.columns) {
    const keys = [c.pk && 'PK', c.reference && 'FK', c.unique && 'UK'].filter(Boolean).join(',');
    er.push(`        ${c.type} ${c.name}${keys ? ' ' + keys : ''} "${c.nullable ? 'NULL' : 'NOT NULL'}"`);
  }
  er.push('    }');
}
for (const r of relations) er.push(`    ${r.to} ${r.nullable ? 'o|' : '||'}--${r.unique ? 'o|' : 'o{'} ${r.from} : "${r.column}"`);
fs.writeFileSync(path.join(here, 'complete-schema.mmd'), er.join('\n') + '\n');
console.log(JSON.stringify({ tables: tables.length, columns: tables.reduce((n, t) => n + t.columns.length, 0), foreignKeys: relations.length, logicalReferences: logical.length, indexCandidates: indexes.length, diagrams: diagrams.length, endpoints: endpoints.length }));
