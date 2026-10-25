import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import NextServer from "next/server.js";
const { NextRequest } = NextServer;
const dirname = path.dirname(fileURLToPath(import.meta.url));
const filename = path.resolve(dirname, "../src/lib/backend-proxy.ts");
assert.equal(
  fs.readFileSync(filename, "utf8"),
  fs.readFileSync(
    path.resolve(
      dirname,
      "../../my-shop-admin-dashboard/src/lib/backend-proxy.ts",
    ),
    "utf8",
  ),
  "both BFF implementations match",
);
const mod = new Module(filename);
mod.filename = filename;
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  filename,
);
const { proxyBackend } = mod.exports;
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
const request = (method = "GET", headers = {}) =>
  new NextRequest("http://localhost:3000/api/v1/me", { method, headers });
test("a stale unauthorized response cannot clear a newer browser session", async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ error: { message: "Expired" } }), {
      status: 401,
    });
  const response = await proxyBackend(
    request("GET", { cookie: "shop_session=opaque" }),
    ["me"],
  );
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("set-cookie"), null);
});
test("cross-origin mutations never reach the API", async () => {
  global.fetch = async () => {
    throw new Error("must not fetch");
  };
  assert.equal(
    (
      await proxyBackend(request("POST", { origin: "https://evil.example" }), [
        "auth",
        "logout",
      ])
    ).status,
    403,
  );
});
test("the BFF forwards only its cookie credential and hides login tokens", async () => {
  let authorization;
  global.fetch = async (url, options) => {
    authorization = options.headers.get("authorization");
    return new Response(
      JSON.stringify({
        data: {
          user: { id: "customer", role: "customer" },
          accessToken: "private-access",
          refreshToken: "private-refresh",
        },
        meta: {},
      }),
      { status: 201 },
    );
  };
  const response = await proxyBackend(
    request("POST", {
      origin: "http://localhost:3000",
      authorization: "Bearer attacker",
      cookie: "shop_session=server-session",
    }),
    ["auth", "login"],
  );
  assert.equal(authorization, "Session server-session");
  const body = await response.json();
  assert.deepEqual(Object.keys(body.data), ["user"]);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
  assert.equal(JSON.stringify(body).includes("private-"), false);
});
test("administration rejects a customer session and revokes the issued token", async () => {
  let count = 0;
  global.fetch = async () => {
    count++;
    return count === 1
      ? new Response(
          JSON.stringify({
            data: {
              user: { role: "customer" },
              accessToken: "temporary",
              refreshToken: "temporary",
            },
          }),
          { status: 201 },
        )
      : new Response("{}", { status: 201 });
  };
  const response = await proxyBackend(
    request("POST", { origin: "http://localhost:3000" }),
    ["auth", "login"],
    true,
  );
  assert.equal(response.status, 403);
  assert.equal(count, 2);
  assert.equal(response.headers.get("set-cookie"), null);
});
