const { spawnSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const assert = require("node:assert/strict");
const path = require("node:path");
const container = "myshop_verify-postgres-1";
function docker(args) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  if (result.status !== 0)
    throw new Error(result.stderr || "Docker verification failed");
  return result.stdout.trim();
}
docker([
  "cp",
  path.resolve("../deploy/runtime-permissions.sql"),
  `${container}:/tmp/myshop-runtime-permissions.sql`,
]);
docker([
  "exec",
  "-e",
  `POSTGRES_API_PASSWORD=${randomBytes(32).toString("hex")}`,
  container,
  "psql",
  "-U",
  "myshop",
  "-d",
  "myshop",
  "-v",
  "ON_ERROR_STOP=1",
  "-f",
  "/tmp/myshop-runtime-permissions.sql",
]);
const result = docker([
  "exec",
  container,
  "psql",
  "-U",
  "myshop",
  "-d",
  "myshop",
  "-tA",
  "-c",
  `SELECT has_table_privilege('myshop_api','orders','UPDATE'),has_table_privilege('myshop_api','audit_logs','UPDATE'),has_table_privilege('myshop_api','payments','DELETE'),has_schema_privilege('myshop_api','public','CREATE'),has_table_privilege('myshop_api','migrations','INSERT');`,
]);
assert.equal(result, "t|f|f|f|f");
console.log(
  JSON.stringify({
    runtimeOrdersWrite: true,
    auditUpdateDenied: true,
    financeDeleteDenied: true,
    schemaDdlDenied: true,
    migrationWriteDenied: true,
  }),
);
