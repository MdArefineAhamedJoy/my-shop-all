const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { Client } = require("pg");
const { DataSource } = require("typeorm");
const { databaseOptions } = require("../dist/database/data-source");
// An isolated random database is created and removed. Existing shop data is untouched.
async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Development benchmark only");
  const name = "myshop_load_" + randomUUID().replaceAll("-", "") + "_test";
  const root = new URL(databaseOptions.url);
  root.pathname = "/postgres";
  const owner = new Client({
    connectionString: root.toString(),
    ssl: databaseOptions.ssl,
  });
  await owner.connect();
  let created = false,
    db,
    server;
  try {
    await owner.query(`CREATE DATABASE "${name}"`);
    created = true;
    const url = new URL(databaseOptions.url);
    url.pathname = "/" + name;
    db = new DataSource({
      ...databaseOptions,
      url: url.toString(),
      extra: { ...databaseOptions.extra, statement_timeout: 120000 },
    });
    await db.initialize();
    await db.runMigrations();
    const category = randomUUID();
    await db.query(
      `INSERT INTO categories(id,version,name,slug) VALUES ($1,1,'Load fixture','load-fixture')`,
      [category],
    );
    await db.query(
      `INSERT INTO products(version,name,slug,description,category_id,status,published_at,gender,tags)
   SELECT 1,'Cotton benchmark item '||n,'benchmark-'||n,'Searchable cotton clothing fixture for representative catalog queries',$1,'published',now(),'unisex',ARRAY['benchmark'] FROM generate_series(1,10000) n`,
      [category],
    );
    await db.query(
      `INSERT INTO variants(version,product_id,sku,size,color,price_minor) SELECT 1,p.id,p.slug||'-'||s,s,'navy',129900 FROM products p CROSS JOIN unnest(ARRAY['S','M','L']) s`,
    );
    await db.query(
      `INSERT INTO inventory(version,variant_id,available) SELECT 1,id,100 FROM variants`,
    );
    await db.query("ANALYZE");
    const plan = await db.query(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id FROM products WHERE to_tsvector('simple',name||' '||description) @@ plainto_tsquery('simple','9999')`,
    );
    const indices = [];
    const walk = (n) => {
      if (n["Index Name"]) indices.push(n["Index Name"]);
      for (const p of n.Plans || []) walk(p);
    };
    walk(plan[0]["QUERY PLAN"][0].Plan);
    assert.ok(
      indices.includes("products_search_idx"),
      "selective search uses GIN index",
    );
    const port = Number(process.env.LOAD_PORT || 4003),
      base = `http://127.0.0.1:${port}/v1`;
    server = spawn(
      process.execPath,
      ["--max-old-space-size=384", "dist/main.js"],
      {
        cwd: process.cwd(),
        stdio: "ignore",
        env: {
          ...process.env,
          DATABASE_URL: url.toString(),
          PORT: String(port),
          NODE_ENV: "test",
          WORKER_ENABLED: "false",
          SWAGGER_ENABLED: "false",
        },
      },
    );
    const deadline = Date.now() + 30000;
    let ready = false;
    while (Date.now() < deadline) {
      try {
        ready = (await fetch(base + "/health/ready")).ok;
        if (ready) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(ready, "benchmark API starts");
    const measurements = [];
    const statuses = {};
    let count = 0;
    await Promise.all(
      Array.from({ length: 20 }, async () => {
        for (;;) {
          const i = count++;
          if (i >= 150) return;
          const start = performance.now();
          const r = await fetch(
            `${base}/products?limit=20&${i % 2 ? "q=cotton" : "tag=benchmark"}`,
          );
          await r.arrayBuffer();
          measurements.push(performance.now() - start);
          statuses[r.status] = (statuses[r.status] || 0) + 1;
        }
      }),
    );
    measurements.sort((a, b) => a - b);
    assert.equal(
      statuses[200],
      150,
      "all representative catalog requests succeed",
    );
    console.log(
      JSON.stringify(
        {
          products: 10000,
          variants: 30000,
          stockRows: 30000,
          requests: 150,
          concurrency: 20,
          statuses,
          p50Ms: Math.round(measurements[74]),
          p95Ms: Math.round(measurements[142]),
          p99Ms: Math.round(measurements[148]),
          selectiveSearchIndexes: indices,
          searchExecutionMs: plan[0]["QUERY PLAN"][0]["Execution Time"],
          scope:
            "local correctness and latency sample, not production capacity",
        },
        null,
        2,
      ),
    );
  } finally {
    if (server && server.exitCode === null) {
      server.kill();
      await once(server, "exit");
    }
    if (db?.isInitialized) await db.destroy();
    if (created) await owner.query(`DROP DATABASE "${name}"`);
    await owner.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
