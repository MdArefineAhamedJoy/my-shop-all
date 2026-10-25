# MyShop Backend Implementation Plan

This plan implements the proposed [system design](BACKEND-SYSTEM-DESIGN.md), [database model](DATABASE-DESIGN.md) and [API contract](API-CONTRACT.md). Phases follow dependencies. They are not delivery-date commitments; staffing, provider onboarding and business policies are not yet established.

## Phase 0 Business configuration and source data

Agree on payment provider/methods, courier, delivery zones/rates, production tax treatment, return window, refund permissions, guest checkout and retention. Design defaults guide implementation but do not establish production rates or credentials.

Inventory owners provide counts for actual size/color SKUs. Catalog staff confirm canonical categories, BDT prices, approved media and public tags/flags. Keep legacy product ID mappings for links and local-cart migration. Exclude sample customers/orders from production imports.

**Exit:** versioned policy fixtures, canonical sample catalog with variant counts, provider adapter requirements and agreed permission matrix.

## Phase 1 Foundation and identity

Create the backend alongside the three clients. Pin supported runtime/framework/ORM versions after checking official documentation. Add development PostgreSQL/Redis/storage services, validated configuration, migrations, request IDs, safe logs, error envelopes and health endpoints.

Implement users, browser/native session transport, CSRF, recovery/email verification, Staff permissions, Admin MFA, invitations and audit. Generate OpenAPI and client DTO artifacts. Establish isolated staging accounts and secret management.

**Exit:** real login/recovery replaces preview behavior; role injection and cross-customer access tests pass; no financial command trusts a submitted role or total.

## Phase 2 Catalog and inventory

Implement products/categories/variants, archive/publish, approved media uploads, inventory receipts/adjustments/ledger, public search/filtering, related products and storefront revisions. Add expected-version checks and audit. Import approved catalog into staging, verify mappings/counts, then use the reviewed process for production.

**Exit:** persisted admin changes reach web/mobile after publication; stock is per variant; stale edits conflict clearly; public content contains no internal configuration.

## Phase 3 Shopping and COD vertical slice

Implement owned/guest carts, merge, wishlist, address book, server pricing, quote versions/expiry, idempotent order placement, stock locking and COD allocation. Add customer order history and admin manual orders through the same services.

Connect all clients to staging for product → variant → cart → quote → order → admin processing → shipment → delivery → authorized COD collection. Replace simulated confirmations with durable server facts.

**Exit:** no overselling in concurrency tests; retries return one order; clients show the same order and balance; COD stays unpaid until collection evidence is recorded.

## Phase 4 Online payment and workers

Implement durable payment attempts/tasks, hosted checkout, provider inbox, verification, reconciliation, reservation expiry races, late capture compensation and operational exception views. Add SQL outbox dispatch, deduplicating consumers, invoice/receipt generation and notifications.

Certify each enabled method in sandbox. Hide unimplemented methods through `/checkout/options`. Exercise provider timeout, duplicate/missing/reordered events and captured-after-expiry cases.

**Exit:** financial scenarios converge without duplicate fulfillment or retry charges; unresolved operations remain reconcilable; application servers never handle raw card details.

## Phase 5 Returns and reporting

Implement return eligibility/quantities, approval, physical receipt/inspection, idempotent restocking, per-funding-source refund limits and reconciliation. Add credit documents, finance permissions, optional second approval and COD refund evidence.

Replace fake dashboard counts with defined backend metrics. Add bounded exports, settings/staff administration, consent/double opt-in and subscription lifecycle. Report Asia/Dhaka date boundaries and freshness.

**Exit:** concurrent partial returns/refunds cannot exceed entitlement or captured amount; reports reconcile to committed facts; cancellation, return and refund remain distinct.

## Phase 6 Production rollout

Run the acceptance matrix, load exercises, restore and incident drills in staging. Record operational settings and provider/courier reconciliation procedures. Review generated API clients against frontend form fields before switching production traffic.

Release compatible adapters behind controlled feature flags. Staff exercise the complete flow first, then enable a limited customer cohort and expand while watching checkout errors, payment exceptions and stock reconciliation. Assign a launch operator and document rollback to the last compatible application image.

**Exit:** agreed objectives have observed results; restore/reconciliation is exercised; production preview mode is disabled; every enabled checkout method has a validated integration.

## Client integration map

| Existing boundary | Replacement |
| --- | --- |
| Web `src/lib/mockData.ts` and page imports | Catalog/content services; server-rendered public reads where appropriate |
| Web `src/lib/store.ts` | Variant-ID cart, server sync and guest merge |
| Web checkout page | Quote/placement, durable retry key, hosted payment and actual order status |
| Web login/signup | Auth service/session state and protected account flow |
| Web home/header/footer | Published content and server-backed newsletter consent |
| Admin `src/lib/data.ts`, JSON fixtures | Paginated admin services; remove fake production data |
| Admin `ProductForm.tsx` | Explicit variants, media intents, minor-unit prices and publish validation |
| Admin orders/shared modals | Lifecycle commands; remove trusted editable total/Paid shortcut |
| Admin returns/invoices | Actual return records and authorized generated documents |
| Admin login/protected layout | Server session and permission enforcement |
| Admin settings/storefront | Versioned persistence, publish, audit and invalidation |
| Mobile auth service/types | Real identity/challenge contracts; remove fixed preview OTP |
| Mobile SessionProvider | Server session restore/revoke, OS-protected credential storage and cache clearing |
| Mobile catalog service/useCatalog | API filters/pagination and identity-aware non-preview query keys |
| Mobile product/wishlist direct imports | Detail, related-product and wishlist API projections |
| Mobile reducer/ShopProvider | Variant identity, server shopping/account data and reversible optimistic updates |
| Mobile order service/checkout hook | Quote, durable placement, payment action/status and retry handling |
| Mobile commerce utilities | Display formatting; server totals are authoritative |
| Mobile sync script | Preview fixtures/assets only, not production synchronization |

Never convert preview receipts into real orders. Migrate only cart/wishlist intent, resolve legacy variants explicitly and show stock/price adjustments. Clear prior identity's profile/address/order caches before rendering another customer's data.

## Acceptance test matrix

Use real PostgreSQL for transaction tests, fake providers for deterministic failures, actual sandbox contracts for adapter semantics and API/client end-to-end tests. Unit tests focus on pricing allocation and lifecycle decisions.

| Scenario | Required result |
| --- | --- |
| Two units, ten concurrent buyers | At most two successful holds/allocations; counters remain valid |
| Multiple lines, one unavailable | Entire placement rolls back; no partial order/hold |
| Same key concurrently retried | One order/task; replay or documented in-progress response |
| Same key, changed input | 409 conflict; original unchanged |
| Same quote, new key | No second order due to unique quote consumption |
| Cart/price/rules change after quote | New quote/acceptance before placement |
| Client sends low total or Paid | Fields rejected; no financial effect |
| Same size, different colors | Distinct variant lines on every client |
| Capture races expiry | One stock outcome; late money compensated without reviving order |
| Cancellation races shipment | One valid transition; no stock released for committed shipment |
| Duplicate/reordered callbacks | One settlement; capture cannot become failure |
| Callback amount/currency/merchant mismatch | No settlement; rejection/incident recorded |
| Provider accepts, response lost | Unknown outcome reconciles same reference; no new charge |
| Duplicate external captures | Preserve money facts, apply one and refund overpayment |
| Missing callback | Reconciliation converges on provider state |
| Crash after SQL commit | Outbox/task resumes; no committed order lost |
| Crash after provider acceptance | Stable reference/query resolves ambiguous effect |
| Concurrent refunds | Pending plus completed never exceed funding-source capacity |
| Partial refund rounding | Minor-unit allocations sum exactly to original totals |
| Concurrent returns | Approved quantity never exceeds remaining shipped entitlement |
| Repeated inspection/restock | One movement and consistent accepted quantities |
| COD delivery without collection | Delivered order remains unpaid |
| Cross-customer IDs | Denial for orders, addresses, returns and documents |
| Guest knows email/order number | No access without capability |
| Registration/Staff supplies role | No unauthorized privilege grant |
| Guessed/replayed reset OTP | Limits, expiry and single-use token enforced |
| Revoked session/disabled account | Next protected browser/native call fails |
| Browser mutation without CSRF proof | Rejected despite valid cookie |
| Product archived after purchase | History/documents remain intact |
| Concurrent default-address writes | One default per customer |
| Internal setting in content | No public DTO/cache disclosure |
| Newsletter opt-out/reconfirmation | Consent purpose/history and repeat safety preserved |
| Redis/worker outage | Durable SQL intent retained and replayed after recovery |
| Backup restore | Measured RPO/RTO; reconciliation detects newer external events |
| Sale load | Record latency, lock/pool/queue saturation and failure rate against proposed targets |

## Architecture decisions

| Decision | Rationale | Revisit when |
| --- | --- | --- |
| Modular monolith | Three TypeScript clients and shared checkout transaction | Independent deployment has a safe consistency boundary |
| PostgreSQL truth | Relational commerce and inventory/financial invariants | Specialized read workload exceeds measured capacity |
| Opaque sessions | Immediate revocation and browser/native parity | Federation or delegation needs a separate protocol |
| Variant inventory | Apparel combinations need independent stock | Multiple warehouses become a requirement |
| SQL outbox and queue | Commit cannot lose downstream intent | Dispatch exceeds measured SQL capacity |
| REST/OpenAPI | Explicit contract for three clients | A demonstrated need justifies another interface |
| Server quotes | Consistent pricing and policy acceptance | Retain invariant even if pricing becomes a service |
| Single shipment | Reduces initial fulfillment complexity | Partial shipment is a confirmed requirement |

## Documentation verification

Validate repository links, endpoint/state consistency, money examples, Mermaid syntax and rendered readability. The backend acceptance cases above describe future required work, not features already tested in this repository. Application lint/build checks do not validate an unimplemented backend.
