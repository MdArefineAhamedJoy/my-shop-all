import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
if (existsSync(".env")) {
  console.log(".env already exists; existing configuration was preserved.");
} else {
  const env = readFileSync(".env.example", "utf8")
    .replace(
      "replace-with-at-least-48-random-characters-before-starting",
      randomBytes(48).toString("hex"),
    )
    .replace(
      "replace-with-64-hex-characters-generated-by-crypto-randomBytes",
      randomBytes(32).toString("hex"),
    )
    .replace(
      /^SEED_ADMIN_PASSWORD=.*$/m,
      `SEED_ADMIN_PASSWORD=${randomBytes(24).toString("base64url")}`,
    );
  writeFileSync(".env", env, { flag: "wx", mode: 0o600 });
  console.log(
    "Created local .env with random signing/encryption keys and administrator password.",
  );
  console.log(
    "Run PostgreSQL, npm run migration:run, then npm run seed. Store the one-time MFA enrollment URI privately.",
  );
}
