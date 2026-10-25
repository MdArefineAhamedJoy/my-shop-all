# MyShop deployment

The backend, storefront and administration use separate services. Caddy is the only public entry point; PostgreSQL, the API container and Next servers have no host ports. Caddy supplies trusted client addresses. The browser BFF forwards those addresses only with `TRUSTED_PROXY_HEADERS=true`; do not enable this on a publicly reachable Next server without the trusted proxy.

## Configure and launch

1. Point three DNS names at the host: shop, admin and API. Allow inbound 80/443. Install Docker with Compose.
2. Copy `.env.example` to `.env`. Generate separate random hexadecimal PostgreSQL passwords, a random JWT secret of at least 48 characters and a 32-byte hexadecimal encryption key. Supply the real SMTP URL and sender. URL-encode SMTP credentials. Keep this file private and outside version control.
3. From this directory run `docker compose --env-file .env config --quiet`, then `docker compose --env-file .env up --build -d`. Do not print the resolved configuration: it contains secrets.
4. Migrations run as the schema owner. The permissions job creates the restricted API role and grants new tables while protecting immutable financial/audit records. The API waits for both jobs. On upgrades, rerun these one-shot jobs before replacing the API. Use a maintenance window for migrations that require exclusive locks.
5. Bootstrap an administrator with `node dist/database/seed.js` in the **migration** container environment, using private `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` variables and a private mounted setup-file destination. The seed writes a one-time MFA URI to `.local-admin-setup.txt`; import it into an authenticator and remove the file after secure enrollment. Do not put the password or URI into shell history, logs or tickets. This development seed also creates a clearly named sample product; archive it before opening the store.
6. Check `/v1/health/ready` on the API domain, storefront browsing, admin MFA, customer checkout and actual SMTP delivery. Configure business shipping/tax/return settings through administration. Swagger is disabled in the production manifest; the generated backend `openapi.json` can be imported locally for API testing.

`DATABASE_SSL=false` applies to the private Compose network. For a managed database, replace the URL, enable verified database TLS and remove the bundled PostgreSQL service/permissions job as appropriate. Use persistent storage on one host; multiple API hosts require shared media or object storage.

## Online payment

The adapter uses SSLCommerz hosted checkout. Configure `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` and the correct sandbox flag. `PAYMENT_PUBLIC_URL` is derived from the API domain. Register `/v1/payments/sslcommerz/ipn` with the merchant account. The public API must be reachable by the provider. Localhost cannot receive provider notifications.

The customer redirect displays order state; it does not settle funds. The API verifies currency, exact amount, transaction identity and risk through the provider. The minute worker reconciles pending payments and submitted refunds. Risky payments block fulfillment. Pending or ambiguous payments hold stock until the provider confirms a terminal failure. The same order never silently starts a second gateway transaction.

Refunds require the current staff password and a stable idempotency key. Funds remain reserved while a refund is pending. Only provider-confirmed refunds update the ledger. If refund initialization times out before a provider reference is received, the refund stays `unknown`; it is not retried automatically. The provider status response does not establish the amount of an arbitrary reference. Reconcile the original `refund_trans_id` with merchant support and use an audited operator/database procedure after confirming the exact amount; no HTTP endpoint guesses the financial outcome. A process crash during submission similarly requires operator review. Monitor `queued/submitting/unknown/processing` refund records and payment `risk/unknown` states through the protected gateway list APIs.

Merchant credentials, provider public-IP registration and a real sandbox transaction/refund are still required to validate the account-specific integration. Contract tests use a stub provider transport with a real PostgreSQL ledger. No real card or wallet was charged during local verification.

## Operations and rollback

- Back up PostgreSQL with `pg_dump -Fc` using the migration account and copy media separately. Encrypt backups and keep off-host copies. Test `pg_restore` into a separate database before launch and after backup changes. The repository's migration replay test is not a backup restore drill.
- Keep images from the previous release. Roll back application images only when the previous application supports the current schema. Inspect each migration's down method and back up before a database rollback; new payment data must not be discarded.
- Monitor readiness, latency, pool waits, DB locks, disk space, SMTP failures, outbox retries and reconciliation states. Keep gateway credentials and auth headers out of access logs.
- No VPS/domain, production SMTP credentials or merchant credentials were supplied in this workspace. The manifest is prepared; public DNS/TLS deployment and external delivery/settlement are not claimed as completed.

Primary references: [SSLCommerz integration](https://developer.sslcommerz.com/doc/v4/), [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), [PostgreSQL backups](https://www.postgresql.org/docs/current/backup-dump.html).
