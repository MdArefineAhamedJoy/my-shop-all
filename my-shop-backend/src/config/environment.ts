import "dotenv/config";

export function validateEnvironment(env: Record<string, unknown>) {
  const required = ["DATABASE_URL", "JWT_SECRET", "APP_ENCRYPTION_KEY"];
  for (const key of required)
    if (!env[key]) throw new Error(`${key} is required (see .env.example)`);
  if (
    String(env.JWT_SECRET).length < 48 ||
    String(env.JWT_SECRET).includes("replace-with")
  )
    throw new Error("JWT_SECRET must contain at least 48 random characters");
  if (!/^[a-f\d]{64}$/i.test(String(env.APP_ENCRYPTION_KEY)))
    throw new Error(
      "APP_ENCRYPTION_KEY must contain 64 hexadecimal characters",
    );
  if (!/^postgres(ql)?:\/\//.test(String(env.DATABASE_URL)))
    throw new Error("DATABASE_URL must be a PostgreSQL URL");
  for (const [key, fallback, min, max] of [
    ["PORT", 4000, 1, 65535],
    ["DB_POOL_MAX", 20, 1, 100],
    ["TRUST_PROXY_HOPS", 0, 0, 5],
    ["SHIPPING_MINOR", 8000, 0, 10000000],
    ["FREE_SHIPPING_THRESHOLD_MINOR", 300000, 0, 100000000],
    ["TAX_BASIS_POINTS", 0, 0, 10000],
    ["RETURN_WINDOW_DAYS", 14, 1, 365],
  ] as const) {
    const n = Number(env[key] ?? fallback);
    if (!Number.isSafeInteger(n) || n < min || n > max)
      throw new Error(`${key} is invalid`);
    env[key] = n;
  }
  for (const key of ["DATABASE_SSL", "SWAGGER_ENABLED", "WORKER_ENABLED"]) {
    if (env[key] !== undefined && !["true", "false"].includes(String(env[key])))
      throw new Error(`${key} must be true or false`);
  }
  if (
    Boolean(env.SSLCOMMERZ_STORE_ID) !== Boolean(env.SSLCOMMERZ_STORE_PASSWORD)
  )
    throw new Error("Both SSLCommerz credentials must be configured");
  if (env.SSLCOMMERZ_STORE_ID) {
    const paymentUrl = new URL(String(env.PAYMENT_PUBLIC_URL || ""));
    if (
      paymentUrl.protocol !== "https:" ||
      paymentUrl.search ||
      paymentUrl.hash ||
      paymentUrl.username ||
      paymentUrl.pathname !== "/"
    )
      throw new Error("PAYMENT_PUBLIC_URL must be a public HTTPS origin");
    if (!["true", "false"].includes(String(env.SSLCOMMERZ_SANDBOX)))
      throw new Error("SSLCOMMERZ_SANDBOX must be true or false");
  }
  if (!env.CORS_ORIGINS)
    throw new Error("CORS_ORIGINS must list allowed browser origins");
  if (!env.APP_URL) throw new Error("APP_URL is required");
  if (env.NODE_ENV === "production" && !env.STOREFRONT_URL)
    throw new Error("STOREFRONT_URL is required in production");
  if (env.STOREFRONT_URL) {
    const url = new URL(String(env.STOREFRONT_URL));
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.origin !== String(env.STOREFRONT_URL) ||
      (env.NODE_ENV === "production" && url.protocol !== "https:")
    )
      throw new Error("STOREFRONT_URL must be an exact storefront origin");
  }
  const appUrl = new URL(String(env.APP_URL));
  if (
    !["http:", "https:"].includes(appUrl.protocol) ||
    (env.NODE_ENV === "production" && appUrl.protocol !== "https:")
  )
    throw new Error("APP_URL must use HTTP(S); production requires HTTPS");
  const origins = String(env.CORS_ORIGINS)
    .split(",")
    .map((v) => v.trim());
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (
      parsed.origin !== origin ||
      (env.NODE_ENV === "production" && parsed.protocol !== "https:")
    )
      throw new Error(
        "CORS_ORIGINS must contain exact origins; production requires HTTPS",
      );
  }
  return env;
}
