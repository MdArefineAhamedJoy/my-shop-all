import "dotenv/config";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://myshop:myshop_local@127.0.0.1:5433/myshop_test";
if (!new URL(process.env.DATABASE_URL).pathname.endsWith("_test"))
  throw new Error(
    "E2E tests require a dedicated database with a name ending in _test",
  );
process.env.JWT_SECRET =
  "test-only-jwt-secret-that-is-longer-than-forty-eight-characters";
process.env.APP_ENCRYPTION_KEY = "a".repeat(64);
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.NODE_ENV = "test";
process.env.WORKER_ENABLED = "false";
process.env.SWAGGER_ENABLED = "true";
