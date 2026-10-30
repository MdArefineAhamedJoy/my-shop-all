import "reflect-metadata";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import dataSource from "./data-source";
import { validateEnvironment } from "../config/environment";
import { newTotpSecret } from "../modules/auth/crypto";
import {
  demoCustomers,
  demoId,
  demoProducts,
  demoStaff,
} from "./demo/fixtures";
import { DemoCredentials, demoMarkerId, seedDemo } from "./demo/seed";
import { AuditLog } from "../modules/platform/entities/platform.entity";

async function main() {
  validateEnvironment(process.env);
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo data is disabled in production");
  const databaseUrl = new URL(process.env.DATABASE_URL!);
  const localDatabase = ["localhost", "127.0.0.1", "[::1]"].includes(
    databaseUrl.hostname,
  );
  const composeDatabase =
    databaseUrl.hostname === "postgres" && existsSync("/.dockerenv");
  if (!localDatabase && !composeDatabase)
    throw new Error("Demo seed is limited to a local PostgreSQL database");
  await dataSource.initialize();
  try {
    if (await dataSource.showMigrations())
      throw new Error("Run migration:run first");
    const credentialsPath = resolve(
      process.env.DEMO_CREDENTIALS_PATH || ".local-demo-accounts.json",
    );
    await mkdir(resolve(credentialsPath, ".."), { recursive: true });
    let credentials: DemoCredentials;
    try {
      credentials = JSON.parse(
        await readFile(credentialsPath, "utf8"),
      ) as DemoCredentials;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      if (await dataSource.manager.existsBy(AuditLog, { id: demoMarkerId }))
        throw new Error(
          "Demo dataset already exists but its private credentials file is missing. Restore that file or use password recovery; existing passwords were preserved.",
        );
      const accounts = [
        ...demoCustomers.map(([name]) => ({
          email: `demo.${name.toLowerCase()}@example.com`,
          password: `Demo-${randomBytes(18).toString("base64url")}`,
        })),
        ...demoStaff.map((staff) => {
          const email = `demo.${staff.key}@example.com`;
          const mfaSecret = newTotpSecret();
          return {
            email,
            password: `Demo-${randomBytes(18).toString("base64url")}`,
            mfaSecret,
            provisioningUri: `otpauth://totp/MyShop:${encodeURIComponent(email)}?secret=${mfaSecret}&issuer=MyShop`,
          };
        }),
      ];
      credentials = { accounts };
      await writeFile(
        credentialsPath,
        `${JSON.stringify({ ...credentials, note: "Private local demo logins. Staff still require authenticator MFA. Existing administrator credentials are unchanged." }, null, 2)}\n`,
        { flag: "wx", mode: 0o600 },
      );
    }
    const imageDir = resolve("storage", "images");
    await mkdir(imageDir, { recursive: true });
    for (const image of new Set(demoProducts.map((p) => p.image))) {
      try {
        await copyFile(
          resolve(__dirname, "../../demo-assets", `${image}.webp`),
          resolve(imageDir, `${demoId(`image:${image}`)}.webp`),
          constants.COPYFILE_EXCL,
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }
    const result = await dataSource.transaction((m) =>
      seedDemo(m, credentials, process.env.APP_URL!),
    );
    console.log(
      result.inserted
        ? `Demo dataset added: ${demoProducts.length} products, 12 customers, 2 MFA staff, 120 orders, 60 COD collections, 60 returns, 10 refunds, 10 coupons and 10 collections.`
        : "Demo dataset already exists; all current data and stock were preserved.",
    );
    console.log(
      `Private demo logins: ${credentialsPath} (keep private; never commit)`,
    );
    console.log(
      "No mail or gateway transactions were queued. Existing accounts and published storefront content were preserved.",
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module)
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Demo seed failed");
    process.exitCode = 1;
  });
