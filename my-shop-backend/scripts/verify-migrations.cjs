const { randomUUID } = require("node:crypto");
const { Client } = require("pg");
const { DataSource } = require("typeorm");
const { databaseOptions } = require("../dist/database/data-source");

async function verify() {
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "Run migration verification only against a development PostgreSQL server",
    );
  const name = "myshop_migration_check_" + randomUUID().replaceAll("-", "");
  const adminUrl = new URL(databaseOptions.url);
  adminUrl.pathname = "/postgres";
  const client = new Client({
    connectionString: adminUrl.toString(),
    ssl: databaseOptions.ssl,
  });
  let created = false;
  let db;
  await client.connect();
  try {
    // Only a new random database made by this process is ever removed.
    await client.query(`CREATE DATABASE "${name}"`);
    created = true;
    const url = new URL(databaseOptions.url);
    url.pathname = "/" + name;
    db = new DataSource({ ...databaseOptions, url: url.toString() });
    await db.initialize();
    const migrations = await db.runMigrations();
    const drift = await db.driver.createSchemaBuilder().log();
    if (drift.upQueries.length)
      throw new Error("Entity metadata and migrated schema differ");
    for (const _migration of migrations) await db.undoLastMigration();
    const tables = await db.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'migrations'",
    );
    if (tables.length)
      throw new Error("Rollback left application tables behind");
    const reapplied = await db.runMigrations();
    if (reapplied.length !== migrations.length)
      throw new Error("Migration replay failed");
    console.log(
      `${migrations.length} migrations passed: fresh install, zero schema drift, complete rollback and reapply.`,
    );
  } finally {
    if (db?.isInitialized) await db.destroy();
    if (created) await client.query(`DROP DATABASE "${name}"`);
    await client.end();
  }
}
verify().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
