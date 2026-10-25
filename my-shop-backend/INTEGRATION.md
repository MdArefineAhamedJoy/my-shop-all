# Live clients and verification

## Local use

Start the API on port 4000 after migrations. The storefront and admin each have `.env.example` files. Copy them to `.env.local`; run the storefront on 3000 and admin on 3001. `API_INTERNAL_URL` is a server-only variable; `APP_ORIGIN` is the exact browser origin for CSRF checks.

```powershell
# my-shop-front-end
pnpm dev
# my-shop-admin-dashboard
pnpm exec next dev --port 3001
# my-shop-mobile
pnpm exec expo start --web --port 8081
```

Native mobile uses `EXPO_PUBLIC_API_URL`. Use a reachable LAN address for a physical phone and HTTPS in production. It is a public URL, never a secret. Native refresh tokens use Expo SecureStore when remember-me is enabled. The Expo web preview keeps credentials in memory and signs out after a full reload. Web storefront/admin use separate HttpOnly cookies; browser JavaScript receives no access or refresh token. Logout/reset/disabled accounts revoke stored sessions. The backend also supports the existing short-lived bearer JWT flow for Swagger and native clients.

Catalog, carts, wishlists, addresses, quotes, orders and account data use real APIs. Empty results and service errors do not fall back to mock commerce data. Checkout uses server totals, current stock and stable idempotency keys. Administration uses actual catalog/stock, customer orders, fulfillment, COD, refunds/returns, settings, reports and storefront revisions. Some original presentation components and reducer fixtures remain in the source tree for design/domain tests; active commerce routes use the live adapters. Shop filters use server queries and cursor pagination. Sorting controls currently order the products loaded into the client, with server order newest-first and price sorting over loaded products.

No social identity provider has been configured; inactive Google/Facebook sign-in controls were removed. Guest browsing is supported; checkout requires an account. SSLCommerz is exposed as a checkout option only when configured. Payment attempts and refund status are verified by the backend; see [deployment instructions](../deploy/README.md).

## Reproducible checks

From the backend directory:

```powershell
npm run build
npm run typecheck
npm test
npm run test:e2e
npm run test:migrations
npm run openapi
node scripts/mail-smoke.mjs
node scripts/client-smoke.cjs
node scripts/load-representative.cjs
node scripts/runtime-role-smoke.cjs
```

The browser script requires the installed mobile Playwright package and Chrome, both Next clients running and the private local admin MFA setup file. It creates a named test customer and a real COD order, fulfills and records collection, and leaves that audit history in the development database. Never run it against production. The SMTP script requires local Mailpit and an enabled email worker; it creates a test identity, consumes a delivered reset token and verifies session revocation. A local SMTP inbox proves delivery to Mailpit, not deliverability to real customer mailboxes. Local auth rate limits apply to repeated smoke runs; do not weaken production limits to run tests.

The representative load script creates its own random database, migrates it, inserts 10,000 products, 30,000 variants and 30,000 stock rows, verifies selective GIN search and starts a temporary API on 4003. It removes only the database/process it created. Fixture inserts use a longer setup timeout; API query/lock timeouts remain unchanged.

Local recorded run on 2026-10-25: 150 catalog requests, concurrency 20, all HTTP 200; p50 299 ms, p95 1,158 ms, p99 1,283 ms. Selective text search used `products_search_idx`, execution 2.089 ms. This Windows development machine also ran Docker/Metro/browser builds during the measurement. This is a reproducible latency sample, not a production user-capacity guarantee. Tune from measurements on deployment hardware.

In the mobile directory, run `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` and `pnpm exec playwright test`. Browser tests exercise Expo web; iOS/Android device storage, app signing and store distribution require device/build-account verification.

In the storefront directory, `pnpm test:api` checks both matching browser proxy implementations: token redaction, HttpOnly cookies, CSRF rejection, customer rejection by administration and protection against a late unauthorized response clearing a newer login. Web/admin production Docker builds and the client browser flow were verified locally. The runtime-role smoke verifies that normal order writes are permitted while audit updates, payment deletion, schema DDL and migration writes are denied.

The earlier [backend proposal](../docs/backend/README.md) remains a broader roadmap. Features outside the implemented API contract are not implicitly complete.

## Dependency review

The storefront and admin now use Next 16.4.3, React 19.3.1 and Zod 4.6.7, with patched transitive packages and updated lockfiles. The shadcn generator is a development dependency. Backend, web and admin production dependency audits reported no known vulnerabilities on 2026-10-25. This is a point-in-time package audit, not a guarantee against undiscovered vulnerabilities.

Expo was updated within SDK 57 to the recommended patch and Router patch. Its CLI still pulls `node-forge` and Zod 3 versions reported by the package audit as two high advisories. The installed node-forge advisory has no published patched version. These are Expo development-tool dependencies; the application uses Zod 4.6.7 and the API uses Nest validation. Keep the development server local, track the upstream fixes, and review the build environment before release. No forced major-version replacement of Expo's internal schema library was made, and the complete mobile dependency tree is not claimed clean.
