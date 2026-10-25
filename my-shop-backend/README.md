# MyShop backend

NestJS 11, PostgreSQL and TypeORM modular backend for the existing store, admin dashboard and mobile application. TypeORM owns migrations and queries; a second ORM is unnecessary here.

**API:** `http://localhost:4000/v1` · **Swagger:** [localhost:4000/docs](http://localhost:4000/docs) · **OpenAPI:** [localhost:4000/docs-json](http://localhost:4000/docs-json)

## Run locally

Requires Node.js 22+ and PostgreSQL 16+ (verified here with PostgreSQL 18).

```powershell
cd my-shop-backend
npm ci
npm run setup:local
# Point DATABASE_URL in .env at an empty PostgreSQL database.
# Example: port 5433, database/user myshop, local password myshop_local.
npm run migration:run
npm run seed
npm run start:dev
```

`setup:local` creates an ignored `.env` containing random keys and a random `SEED_ADMIN_PASSWORD`. Existing `.env` files are preserved. Never use the example PostgreSQL password outside local development.

`seed` creates one administrator, a published shirt and three stocked variants. It preserves existing accounts and stock, refuses to promote an existing customer, and prints the administrator's MFA enrollment URI **once**. Import it into an authenticator. Log in with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` and the authenticator's current six-digit code. Keep enrollment output private. In this workspace, if `.local-admin-setup.txt` exists, it contains that one-time enrollment output.

For a compiled server, run `npm run build` followed by `npm start`. Startup rejects missing/weak keys, invalid origins, invalid pricing defaults and pending migrations. Shutdown drains the worker and database connections.

## Demo data for every client

After migrations and the administrator seed, run `npm run seed:demo` from this directory. The command is restricted to a local PostgreSQL database and refuses `NODE_ENV=production`.

It adds 32 published products across eight categories, 228 size/color variants with stock and movement history, 12 fictional customers with addresses, carts and wishlists, two staff accounts with mandatory MFA, 40 orders across every fulfillment state, 20 synthetic COD collections, seven returns, two refunds, five coupons, six collections, newsletter samples, audit history and a storefront draft. The storefront is published only when no published revision already exists. All clients connected to this API read the same data. Product images are bundled and served locally; homepage banner images use Unsplash.

Private customer and staff logins are saved to `.local-demo-accounts.json`, excluded from Git and Docker. Use `demo.ayan@example.com` and its password from that file to explore a customer account with an existing cart, wishlist and order history. Staff entries also contain authenticator enrollment URIs. Existing administrator credentials are unchanged.

`DEMO10` is an active 10% coupon. `DEMO15` and `DEMOVIP20` have a BDT 2,000 minimum; `DEMOEXPIRED` and `DEMODISABLED` demonstrate invalid promotions. These fixtures expire 90 days after insertion. Demo orders, collections and refunds carry `DEMO` references and affect local reports, but the seed never queues emails, gateway charges or gateway refunds.

The dataset is created in one transaction with a completion marker. Repeating the command preserves edited products, current stock, orders, passwords and customer carts instead of recreating the data. It does not clear or replace existing records. Conflicting fixture keys cause a rollback. Keep the private credentials file; if it is lost after seeding, use normal password recovery rather than expecting a rerun to reset accounts.

Verification: `npm run test:e2e -- test/demo.e2e-spec.ts` checks the fixture graph, money/stock reconciliation, repeat runs, production refusal and preservation of published content inside a rolled-back PostgreSQL transaction. With the three local clients running and their dependencies installed, `node scripts/demo-client-smoke.cjs` checks the seeded catalog and images, customer account, eight admin screens, and mobile collections/order history. Public media responses allow cross-origin embedding so these clients can display uploaded and seeded images.

## Docker

After `npm run setup:local`, set `POSTGRES_PASSWORD` in `.env` and keep the password in `DATABASE_URL` consistent. The development stack supplies PostgreSQL, Mailpit, a one-shot migration service and the API:

```powershell
docker compose up --build -d
docker compose exec api node dist/database/seed.js
```

Mailpit: [localhost:8025](http://localhost:8025). API, database and mail ports bind to loopback. Stop any other local PostgreSQL on port 5433 first, or change the mapping. Database and media use named volumes. The image runs as the `node` user. Docker Desktop's daemon was unavailable during implementation, so image/Compose execution has not been verified here.

## Swagger test flow

1. Open `/docs`. Call `POST /v1/auth/register` with `name`, `email` and a 12–128 character password. Only customers self-register; role and permission fields are rejected.
2. Copy `data.accessToken` into **Authorize** (token only). Tokens expire in 15 minutes. `/auth/refresh` rotates refresh tokens; logout/password reset revokes stored sessions immediately.
3. Read `/v1/products` and `/v1/products/{slug}`. Copy an actual `variants[].id`.
4. Call `PUT /v1/cart/items/{variantId}` with `{"quantity":1}`. Repeating sets the absolute quantity.
5. Call `POST /v1/checkout/quotes`:

```json
{
  "shippingAddress": {
    "name": "Sample Customer",
    "phone": "+8801700000000",
    "line1": "12 Sample Road",
    "city": "Dhaka",
    "region": "Dhaka",
    "postalCode": "1207",
    "countryCode": "BD"
  },
  "paymentMethod": "cod"
}
```

6. Submit `POST /v1/orders` with `{"quoteId":"<quote UUID>"}` and a fresh UUID in the `Idempotency-Key` header. Reuse the same key/body after transport failures. Changing the body with the same key returns 409. A quote creates at most one order.
7. Read `/v1/me/orders`, `/v1/orders/{id}`, `/tracking` or `/invoice`. Invoice returns a downloadable PDF; another customer's order ID returns 404.
8. Log in as the seeded administrator and replace the authorized token. Use a resource's latest `version` as `expectedVersion`. Fulfillment, cancellation, collection, return transitions, inventory adjustments and refunds require an idempotency key.

Order flow: `pending → processing → shipped → delivered`. Cancellation before shipment restores inventory once. Delivery leaves COD unpaid; `/admin/orders/{id}/cod-collections` records independently evidenced collections. Refund recording requires the operator's current password and cannot exceed collected funds. It records a refund paid externally and **does not transfer money**. A fully collected delivered order can be returned within the configured window; inspection controls sellable restock quantity, and closing requires the prorated refund to be recorded.

Manual orders use `/admin/checkout/quotes` with `customerId`, `items[{variantId,quantity}]`, address and payment method, followed by `/admin/orders`. They preserve the customer's cart and accept neither a client total nor a paid flag.

Verification, recovery and newsletter tokens go through the encrypted mail outbox. Read messages in Mailpit with Compose, or configure a real `SMTP_URL`. Tokens are never returned publicly or logged by the worker. `/admin/jobs` shows redacted delivery state; administrators can retry failed deliveries.

JSON uses `{data,meta:{requestId}}`; lists add `nextCursor` and `hasMore`. Errors use `{error:{code,message,details?},meta:{requestId}}`. `X-Request-ID` correlates failures. Money is **BDT integer minor units**: `129900` means BDT 1,299.00. Report aggregates use decimal strings to preserve precision.

## Module structure

```text
src/
  main.ts, app.module.ts, setup.ts
  common/                     guards, permissions, pagination, errors
  config/                     validated environment
  database/
    data-source.ts            bounded pool, snake_case naming
    entities.ts               entity registry
    migrations/               versioned schema, indexes, constraints
    seed.ts                   repeatable local setup
  modules/
    auth/                     passwords, JWT, sessions, MFA, recovery
    users/                    profiles, addresses, customers, limited staff
    catalog/                  categories, products, explicit SKU variants
    inventory/                balances, movement ledger, adjustments
    cart/                     customer carts and wishlists
    checkout/                 five-minute server-priced quotes
    orders/                   transactional placement and fulfillment
    payments/                 COD, SSLCommerz verification/refund reconciliation
    returns/                  approval, receipt, inspection, restock, close
    promotions/               dated codes, atomic redemption limits
    content/                  storefront revisions, collections, double opt-in
    settings/                 persistent shipping/tax/return policy
    media/                    protected upload, verified WebP conversion
    documents/                protected PDF invoices
    reports/                  real business totals and audit reads
    platform/                 idempotency, shared limits, audit, mail outbox
    health/                   process and database/schema readiness
  scripts/openapi.ts          exports the implemented API
test/                         real PostgreSQL HTTP/security/concurrency tests
scripts/                      local setup and bounded HTTP load smoke
```

Each domain owns its module, controller/service, DTOs and entities as needed. Small domains keep simple operations in a controller. Clients do not import ORM classes.

## Access and security

- Authentication is required globally; catalog/content/health/auth entrypoints and approved product images are explicitly public.
- Owned resources are scoped to immutable user IDs. Admin/staff routes check server-defined permissions. Staff/settings management is administrator-only; staff cannot promote themselves or create administrators. HTTP administrator disabling is excluded.
- Passwords use salted scrypt, `N=131072,r=8,p=1`; tests use `N=16384`. Refresh/recovery tokens store SHA-256 digests. MFA secrets/mail tokens use AES-256-GCM with a separate key. Admin/staff require MFA; customers can enroll. TOTP counters prevent reuse.
- JWT verification fixes issuer, audience and HS256. Indexed stored sessions are checked on every authenticated request. At most 50 active sessions per identity; expired records are cleaned.
- Strict nested DTOs reject unknown fields. Queries are parameterized. Page/search/cart/money/report bounds and state transitions are enforced.
- Atomic PostgreSQL rate counters work across replicas with tighter auth limits and hashed IP/email keys. Process liveness bypasses the database; readiness verifies schema state.
- Helmet, exact-origin CORS, request IDs, bounded JSON/multipart input and verified image decoding/metadata removal are configured. Production origins/image URLs require HTTPS.
- The API accepts explicit bearer JWTs or opaque `Session` headers from the browser BFF. Browser BFFs own HttpOnly session cookies and enforce exact mutation origins. Native refresh tokens use SecureStore; browser JavaScript never receives long-lived tokens.
- Audit, order events, inventory movements and finance records have no edit/delete APIs. Enforce database append-only permissions with the restricted runtime role in [`database/runtime-role.sql`](database/runtime-role.sql).

## Database performance and concurrency

The 29 domain tables have UUID keys, foreign keys, variant uniqueness, nonnegative stock/money checks and unique quote/order references. Composite indexes cover publication/category pagination, owned orders, state queues and movement history. Full-text search/tags use GIN indexes. Dedicated indexes support financial reports and token/idempotency cleanup. Lists use bounded stable `(created_at,id)` keyset cursors. Product projections batch-load variants and stock.

Checkout serializes a customer's cart, locks product/category publication and variants, locks promotion redemption, and deducts inventory atomically with `available >= quantity`. Locks follow consistent ordering. Order/line snapshots, inventory ledger, quote consumption, idempotency result and mail outbox commit together. Cancel/inspect retries cannot double-restock. Policy versions invalidate old quotes. External mail I/O occurs after commit under a lease, with backoff/retry. Delivery is at least once; stable message IDs support deduplication.

The pool defaults to 20 connections per process: 5-second acquisition, 10-second statement timeout, 3-second lock timeout and 15-second idle-transaction timeout. Budget all replicas' pools plus maintenance connections against PostgreSQL capacity. Consider PgBouncer as deployment size grows. Add Redis/cache/report rollups when measured load warrants them.

Zero lag cannot be promised for an unspecified number of users. Concurrency tests establish correctness, not production capacity. Measure representative large datasets on deployment hardware: p95/p99 latency, lock waits, pool saturation, CPU/memory and `EXPLAIN (ANALYZE,BUFFERS)`. Scrypt needs roughly 128 MiB per password operation; size/limit auth workers accordingly. Multi-host deployments need shared media storage or object storage/CDN.

## Validation

```powershell
npm run typecheck
npm run build
npm test
# Use a dedicated existing database whose name ends in _test.
$env:TEST_DATABASE_URL='postgresql://myshop:myshop_local@127.0.0.1:5433/myshop_test'
npm run test:e2e
npm run test:migrations
npm audit
npm run openapi
# With the API running: a small measurement, not a capacity claim.
npm run load:smoke
```

Tests cover access/ownership, role escalation, permissions/MFA, refresh/recovery, hidden fields, search/injection input, cursor bounds, server prices, duplicate orders, final-unit stock races, coupon exhaustion, manual orders, policy/version conflicts, fulfillment, COD, return/refund limits, restock retries, uploads, content publishing, mail-job redaction and rate limits. Test fixtures stay in the dedicated `_test` database.

`test:migrations` requires a development database role with CREATEDB. It creates a fresh random temporary database, verifies all five migrations and zero entity/schema drift, rolls them all back, reapplies them, and removes only that temporary database. The email worker test uses two real database workers with a stub SMTP transport to verify exclusive queue claims and secret-payload removal; it does not send external mail.

On a memory-constrained Windows machine, set `$env:NODE_OPTIONS='--max-old-space-size=384 --max-semi-space-size=8'` before build/test commands.

## Deployment and current boundaries

Use HTTPS, exact `CORS_ORIGINS`/`APP_URL`, only the actual trusted proxy hop count, real business shipping/tax/return policies and production SMTP. Keep secrets outside version control. Disable public Swagger with `SWAGGER_ENABLED=false` when appropriate. Back up PostgreSQL/media and rehearse restores. Use separate migration and restricted runtime credentials; run migrations once per release. The Compose database user is for development.

This release provides authenticated customer checkout, COD and a configuration-gated SSLCommerz hosted checkout adapter, with provider verification, risk holds, reconciliation and verified online refunds. The web, admin and mobile clients now use live APIs. See [INTEGRATION.md](INTEGRATION.md) for client setup, checks and recorded performance, and [deployment instructions](../deploy/README.md) for the private-service/TLS manifest and payment failure handling.

Local verification includes actual Docker PostgreSQL/migrations/API and actual SMTP delivery to Mailpit. Merchant-specific sandbox settlement, external SMTP deliverability and public hosting need the user's real provider/hosting configuration and have not been verified. No real online payment or refund is claimed.

Guest checkout, courier integrations, signed object-storage uploads, MFA recovery codes, credit notes and asynchronous CSV exports remain outside this implementation. No endpoint simulates their success. PDF invoices currently use Latin fonts; Bengali output needs an embedded licensed Bengali font. The earlier [64-table proposal](../docs/backend/README.md) remains a broader roadmap; `openapi.json` describes implemented routes.

Primary references: [NestJS authentication](https://docs.nestjs.com/security/authentication), [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting), [TypeORM migrations](https://typeorm.io/docs/advanced-topics/migrations/).
