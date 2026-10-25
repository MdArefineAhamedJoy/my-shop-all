# MyShop Backend System Design

Status: proposed implementation design, based on the repository review dated 21 October 2026. The target is one fashion retailer serving a Next.js storefront, a Next.js admin dashboard and an Expo mobile app. Repository evidence is in [Project exploration](PROJECT-EXPLORATION.md); schema and HTTP contracts are specified in [Database design](DATABASE-DESIGN.md) and [API contract](API-CONTRACT.md).

## 1 Architecture decision

Build a TypeScript modular monolith with a NestJS REST API and independently deployed worker process. Keep business state in PostgreSQL. Use Redis for cache, rate limiting and BullMQ job transport, and object storage for product media and private documents. The API and worker share domain modules and migrations.

This choice fits three existing TypeScript clients and keeps checkout, inventory reservations and order creation inside one database transaction. A separate service per domain would introduce distributed transactions and operational overhead before there is evidence of that need. The module interfaces below preserve a path to later service extraction.

![System context](diagrams/01-system-context.svg)

[Editable Mermaid source](diagrams/01-system-context.mmd)

### Technology choices and alternatives

| Concern | Proposed choice | Reason and tradeoff |
| --- | --- | --- |
| API | NestJS, TypeScript, REST, OpenAPI | Domain modules, DI and explicit contracts; adds framework conventions |
| Persistence | PostgreSQL with Prisma migrations/client | Relational transactions and typed access; use parameterized SQL where locking requires it |
| Background work | BullMQ workers and Redis | Retryable invoice/email/provider work; SQL outbox remains the durable dispatch authority |
| Search | PostgreSQL full text and indexed filters | Sufficient starting point; dedicated search waits for measured query or relevance limits |
| Files | S3-compatible storage and CDN | Large files bypass application servers; private invoices require authorized download |
| Authentication | Opaque server sessions | Immediate revocation and clear browser/mobile parity; requires indexed session lookup |
| Monitoring | OpenTelemetry-compatible traces, structured logs and metrics | Correlates API, SQL and worker operations; vendor choice remains open |
| Deployment | Containers on managed runtime; managed PostgreSQL and Redis | Small operational footprint; no Kubernetes requirement at launch |

NestJS documents Redis-backed BullMQ integration in its [queue guide](https://docs.nestjs.com/techniques/queues). The durable outbox and transaction choices here are MyShop design decisions.

### Launch assumptions and targets

These are engineering planning assumptions, not measured traffic or contractual promises.

| Item | Initial assumption or target |
| --- | --- |
| Store and warehouse | One retailer, one warehouse, BDT only |
| Catalog | Up to 10,000 products and 100,000 variants |
| Orders | Up to 1,000/day, with sale bursts |
| Load exercise | 100 catalog reads/sec and 10 checkout attempts/sec for 15 minutes |
| API latency | p95 catalog reads below 300 ms at origin; local checkout transaction below 800 ms, excluding provider calls |
| Availability objective | 99.9% monthly for catalog and order submission |
| Durable dispatch | Oldest undispatched outbox event below 60 seconds under normal operation |
| Recovery objective | RPO at most 15 minutes; RTO at most 2 hours, verified by restore drills |

For orientation, 100,000 variants at an assumed 1 KB each is roughly 100 MB before indexes and related records. At 1,000 orders/day and an assumed 10 KB per order including lines/events, order storage grows roughly 3.65 GB/year before indexes, logs, backups and documents. Media will dominate storage and egress. Measure actual row sizes before sizing production databases.

## 2 Runtime topology

![Backend containers](diagrams/02-containers.svg)

[Editable Mermaid source](diagrams/02-containers.mmd)

The edge terminates TLS, applies coarse abuse controls and routes public API traffic. Browser traffic uses a same-origin `/api/v1` reverse proxy on each web application host so host-only session cookies work without a shared parent-domain cookie. Native mobile uses the public API origin with a bearer session secret. Both transports execute the same application services and authorization rules.

API instances are stateless apart from database and cache connections. Workers run scheduled sweeps and consume jobs. Neither Redis loss nor worker downtime may lose committed orders or permanently lose an event: workers can reconstruct outstanding work from SQL outbox and task state.

### Proposed backend layout

```text
my-shop-backend/
  src/
    main.ts                      API bootstrap
    worker.ts                    Worker bootstrap
    modules/
      identity/                  Users, sessions, recovery, staff access
      customers/                 Profiles, addresses, support views
      catalog/                   Products, categories, variants, pricing
      inventory/                 Balances, reservations, stock ledger
      shopping/                  Carts, merge, wishlist
      checkout/                  Quotes and order orchestration
      orders/                    Order lifecycle and immutable snapshots
      payments/                  Attempts, callbacks, refunds, reconciliation
      fulfillment/               Shipment and courier adapter
      returns/                   Return requests, receipt and inspection
      content/                   Storefront configuration and publishing
      marketing/                 Subscription and consent
      documents/                 Invoices, receipts, credit notes
      reporting/                 Read models and exports
      audit/                     Append-only staff audit events
    infrastructure/
      database/ cache/ queue/ outbox/ storage/ observability/
    common/                      Error envelopes and request context
  prisma/
    schema.prisma
    migrations/
  test/
    integration/ contracts/ concurrency/ e2e/
```

This layout is a proposal; no backend scaffold is created by these documents.

## 3 Domain ownership

![Module ownership](diagrams/03-modules.svg)

[Editable Mermaid source](diagrams/03-modules.mmd)

| Module | Owns | Interfaces and restrictions |
| --- | --- | --- |
| Identity | Credentials, sessions, challenges, roles | Resolves principal and permissions; callers cannot assign their own role |
| Customers | Profile and saved addresses | Exposes owned address lookup; order snapshots remain independent |
| Catalog | Product, category, variant, current price, media references | Returns sellable variant facts; cannot change historical order lines |
| Inventory | Stock balance, reservations, movements | Reserve, allocate, release, ship, receive return; all changes leave ledger entries |
| Shopping | Carts and wishlist | Stores intent; cart does not reserve stock |
| Checkout | Quotes and placement orchestration | Coordinates catalog, inventory, orders and payment attempt creation in one SQL transaction |
| Orders | Order header, lines and transition history | Enforces state machine; no generic unrestricted status patch |
| Payments | Attempts, payment events, refunds and cash collections | Only verified provider outcomes or authorized cash records change settlement facts |
| Fulfillment | Shipments and tracking events | May ship only allocated stock and eligible orders |
| Returns | Return eligibility, item quantities and inspection | Refund approval and restocking are distinct actions |
| Content | Banners, collections, announcement and public configuration | Publishes only sanitized public fields; never exposes provider secrets |
| Documents | Versioned invoice/receipt/credit note records and files | Uses order snapshots; issued documents are not silently rewritten |
| Reporting | Aggregations and exports | Read-only facts; cannot mutate order/payment truth |
| Marketing | Subscriptions and purpose-specific consent | No checkout email automatically becomes a marketing subscriber |
| Audit | Actor, action, entity and redacted change records | Staff writes must append audit in the same transaction |

Modules call exported application services, not another module's repositories. Checkout orchestrates the multi-module transaction through an explicit unit of work; each participating operation accepts that transaction context. The payment provider is never called while database locks are held.

## 4 Authoritative data and invariants

1. A variant represents exactly one purchasable size/color combination and has a unique SKU.
2. Monetary values are integer BDT minor units. `129900` means BDT 1,299.00. Client labels and formatted strings never enter pricing calculations.
3. `available = on_hand - reserved - allocated`; none may be negative and `reserved + allocated <= on_hand`.
4. Cart edits do not hold inventory. An order holds inventory after placement; reservation and allocation are explicit states.
5. An order records immutable product, SKU, price, discount, tax, shipping and address snapshots. Changes to a product or saved address do not rewrite it.
6. Paid totals come from verified financial records. A selected payment option, success redirect or staff-supplied `payment: Paid` is not payment evidence.
7. Refund totals, including in-flight refunds, cannot exceed captured/collected money. Returned quantities cannot exceed shipped quantities after accounting for prior returns.
8. Authorization checks both permission and entity ownership. Unpredictable IDs do not provide authorization.
9. Every externally retryable financial command has a durable idempotency boundary.
10. Domain events describe committed state. Consumers assume delivery at least once and deduplicate effects.

Database uniqueness, foreign keys and row checks provide a second enforcement layer; cross-row invariants require transactional logic. PostgreSQL describes these capabilities in its [constraint documentation](https://www.postgresql.org/docs/current/ddl-constraints.html).

## 5 Catalog and content

Products have a stable ID, unique slug, descriptive content, gender, category, merchandising flags and publication state. Variants own SKU, size/color codes and current price. For launch, variants may inherit a product default price in the admin form, but every published variant has an explicit effective price.

Publish only products with valid media, at least one active variant and valid pricing. Archived products remain referencable by order history. Keep slug aliases on rename so existing product links can resolve to the canonical slug. Return product-level `priceFromMinor` and aggregate availability for listing cards, with variant prices on details.

Use canonical category slugs such as `shirt`, `pants`, `t-shirt`, `polo`, `accessories`. Gender is a separate filter. Collections have ordered product membership or a defined filter rule. `isNew` and `isFeatured` are explicit flags; trending may be a curated label at launch. Best sellers use delivered quantities net of accepted returns over an explicit window, not review counts.

Storefront edits save a draft revision, then publish atomically. Public responses contain a revision and ETag. Cache content for a short bounded TTL and invalidate after publication through an outbox event. Scheduled banners are evaluated against server UTC timestamps. Internal contact settings, permissions and payment credentials never enter public configuration.

Media follows upload-intent → quarantine upload → validation/scan → approved asset → product attachment. Restrict file size, MIME type and decoded image dimensions. Generate thumbnails in a worker. If importing remote URLs, use an allowlisted import job with network egress restrictions; do not let arbitrary URLs reach internal services.

## 6 Pricing and quotes

The server calculates a quote from owned cart items or explicit variant IDs and quantities, delivery address, payment method and an optional promotion code. Reject quantities outside 1–99, inactive variants, unsupported delivery zones and unsupported payment methods. Return line-level explanations for changes.

The quote stores a pricing snapshot and rules revision and expires after a proposed five minutes. It does not reserve stock. Placement revalidates price/rules versions, address, availability and payment eligibility. A changed price, shipping policy or tax rule returns `QUOTE_CHANGED` and a new quote for customer acceptance. Insufficient stock returns `OUT_OF_STOCK`.

```text
lineSubtotal = unitPriceMinor * quantity
lineNet      = lineSubtotal - allocatedDiscountMinor
subtotal     = sum(lineSubtotal)
discount     = sum(allocatedDiscountMinor)
total        = subtotal - discount + shippingMinor + taxMinor
```

Use integer rational arithmetic for rates, with explicit half-up rounding at the line level. Allocate order discounts proportionally and assign leftover minor units using a stable largest-remainder method so lines sum exactly to the order total. Preserve that allocation for partial refunds. Define whether shipping is taxable and whether displayed prices include tax in versioned configuration.

The existing 10% UI tax and free-shipping announcement are sample content. Production tax, delivery zones, shipping thresholds, discount stacking and eligibility require business configuration. No tax rate or legal treatment is established by this design.

## 7 Checkout and inventory concurrency

![Checkout sequence](diagrams/05-checkout-sequence.svg)

[Editable Mermaid source](diagrams/05-checkout-sequence.mmd)

### Atomic order placement

`POST /v1/orders` requires a quote ID and an `Idempotency-Key`. The quote belongs to the authenticated customer or possession-bound guest cart and may produce only one order. The same operation covers authorized staff orders, with a recorded staff actor and no payment override.

Within one PostgreSQL transaction:

1. Insert or lock the scoped idempotency record. Compare the canonical request hash. A reused key with different input returns `409 IDEMPOTENCY_CONFLICT`.
2. Lock the quote and source cart; verify owner, expiry, unused state, active cart/version and current price/rules revisions. Concurrent cart edits cannot pass through the placement guard.
3. Lock inventory balances in ascending variant ID order. Lock any limited promotion entitlement/counter before claiming it, using a consistent global lock order.
4. Recheck every quantity against available stock. Increment `reserved` using a conditional update. If any line fails, roll back all lines and the order.
5. Insert the order, immutable lines/address snapshots, reservation records and status history. Claim coupon usage provisionally if applicable.
6. For COD, immediately convert reserved to allocated, set fulfillment `pending` and payment `unpaid`; no short online-payment timeout applies to the allocated COD stock. For online payment, retain reserved stock and fulfillment `awaiting_payment`; create a payment attempt and an initialization task.
7. Mark quote consumed and its cart converted, append outbox events and store the placement response in the idempotency record. Commit. Later shopping obtains a new active cart rather than mutating the converted cart.

Provider initialization runs after commit. The API may make a bounded attempt to obtain a redirect; if it times out it returns the existing order with `paymentAction: initializing`. A durable worker resumes the same attempt. `GET /orders/{id}/payment-action` exposes the current action to the authorized caller. The cart clears only after the client has a durable order ID, never on a simulated success.

Illustrative inventory update inside the transaction:

```sql
UPDATE inventory_balances
SET reserved = reserved + :quantity, version = version + 1
WHERE variant_id = :variant_id
  AND on_hand - reserved - allocated >= :quantity
RETURNING variant_id;
```

No returned row means insufficient stock. A product with two units and ten simultaneous quantity-one requests may produce at most two successful reservations. Batch operations lock in the same order and retry detected deadlocks a small bounded number of times. PostgreSQL's [row-locking behavior](https://www.postgresql.org/docs/current/explicit-locking.html) supports this serialization; the specific inventory protocol is the proposed MyShop implementation.

### Reservation and allocation lifecycle

Online reservations expire after a proposed 15 minutes. A sweeper locks the order, then balances in sorted order, then reservation rows before release. Successful verified payment converts reserved to allocated in the same transaction as payment settlement. Settlement checks the expiry timestamp even if the sweeper has not run; an elapsed hold is released and the capture becomes a late-payment exception. Shipping decrements both `on_hand` and `allocated`. Cancellation releases reserved or allocated stock exactly once. A received return increases `on_hand` only after inspection approves restocking.

Keep reservation states `held`, `allocated`, `released`, `consumed`. Workers query SQL by state and expiry; Redis job timing is an accelerator, not the only expiry mechanism. Inventory adjustment endpoints cannot set stock below existing holds/allocations and must record a reason and actor.

## 8 Orders and fulfillment

![Order states](diagrams/07-order-state.svg)

[Editable Mermaid source](diagrams/07-order-state.mmd)

| Transition | Required condition | Inventory or financial effect |
| --- | --- | --- |
| Creation → awaiting_payment | Online payment selected | Hold stock |
| Creation → pending | Eligible COD order | Allocate stock; payment remains unpaid |
| awaiting_payment → pending | Verified capture, active hold | Convert hold to allocation |
| pending → processing | Staff permission; online payment captured or COD eligible | Begin fulfillment |
| processing → shipped | Allocated stock, shipment/tracking and immutable packed lines | Consume allocated stock |
| shipped → delivered | Trusted courier event or authorized staff evidence | Record delivery; COD collection is a separate fact |
| awaiting_payment → expired | Hold timeout wins lock race | Release hold; keep attempts reconcilable |
| pending/processing → cancelled | Cancellation wins before shipment commit | Release allocation and request refund if prepaid |

Customer self-cancellation is allowed only while pending; staff may cancel processing orders before shipment. Shipped orders enter a return process after delivery, not a generic cancellation. COD delivery does not itself establish that money was remitted by the courier.

Launch supports one shipment per order and no partial fulfillment. Reject partial shipment commands; represent line quantities in schema so the model can evolve later. Courier callbacks are deduplicated and mapped through an adapter. Keep tracking history and raw normalized provider references. Reject backward fulfillment transitions.

Staff edits after placement are restricted to notes and permitted shipping contact corrections before shipment, with before/after audit. Item, price, payment-method or financial changes require cancellation/replacement or a separate adjustment workflow; there is no arbitrary order patch.

## 9 Payment lifecycle and provider integration

![Payment callback sequence](diagrams/06-payment-sequence.svg)

[Editable Mermaid source](diagrams/06-payment-sequence.mmd)

The UI offers card, bKash, Nagad and COD. Launch enables only methods supported by configured merchant credentials and a tested adapter. Provider selection and onboarding remain open; the design does not assume identical signatures or callback semantics across providers.

```text
PaymentProvider
  initialize(attemptId, amountMinor, currency, returnUrl)
  verifyCallback(rawBody, headers)
  query(providerReference)
  refund(refundId, captureReference, amountMinor)
```

Use hosted payment pages or provider tokenization for card collection. Replace the existing raw card-input UI before accepting real payments. Application servers, logs and databases must not receive PAN or CVC.

An attempt moves `created → initializing → pending → captured | failed | expired`. A timeout after sending a provider command is `unknown`, not failed; query/reconcile it before creating another attempt. One order has at most one captured attempt and at most one unresolved attempt. A second successful external capture becomes an overpayment incident requiring refund, not a second order settlement.

### Verified callback protocol

1. Verify the provider-specific signature/authentication using raw request bytes if required. If callbacks are not cryptographically sufficient, query the provider before treating them as financial evidence.
2. Match merchant account, attempt/reference, expected amount and currency. Persist a deduplicated inbox event. Return success only after durable acceptance; return a retryable error if persistence is unavailable.
3. After any external verification call, begin a transaction and lock the order, attempt, payment summary and reservations in the standard order.
4. Apply only a legal, monotonic transition. A repeated event is a successful no-op. Never turn a captured attempt into failed because a delayed failure arrived.
5. If a hold remains valid, capture and allocate stock together. If expiry or cancellation already released stock, record the capture and set `payment_exception`; do not revive fulfillment. Schedule a refund using its own idempotency key.
6. Append settlement/outbox/audit facts and commit. Send confirmation and generate documents asynchronously.

A success redirect only prompts the client to fetch order status. If callback delivery fails, reconciliation polls unresolved attempts, including recently expired orders, and converges on the same state machine. If provider query is unavailable, keep the attempt unresolved and prevent a new payment retry until it can be resolved or reviewed.

### Cash on delivery

Persist a COD collection record against order and shipment, with amount, evidence, actor and external remittance reference. Delivery and collection/remittance are separate timestamps. Finance-authorized confirmation records settlement; fulfillment staff cannot mark arbitrary orders paid. A cancelled or returned COD shipment releases/returns stock according to physical movement and does not manufacture a payment or refund.

## 10 Returns and refunds

![Return workflow](diagrams/09-returns.svg)

[Editable Mermaid source](diagrams/09-returns.mmd)

Return status follows `requested → approved → received → inspected → closed`, with `requested → rejected` as a terminal alternative. Each return records order lines, requested, approved, received and accepted quantities, reason, evidence, disposition and staff decisions. Keep the order's delivered status; compute an optional display badge such as partially returned from related return records.

Eligibility checks ownership, delivery, configured return window and remaining returnable quantity. Approval reserves that return entitlement under an order-line lock so concurrent requests cannot overclaim it. Receipt does not automatically restock: inspect and choose `restock`, `damaged` or `quarantine`.

Refund status begins `requested → submitting`, then becomes `pending`, `unknown`, `succeeded` or conclusively `failed` according to the provider outcome. Pending/unknown operations converge to succeeded/failed through verification. Before submitting, lock the payment summary and reserve the refund amount so concurrent refunds cannot exceed the captured/collected balance. A timeout holds that allowance until provider reconciliation resolves it; only a conclusive failure releases it. Use the same refund operation reference on retries. Staff cannot set refund success through a free-form status field.

Use original line discount/tax allocations to determine refundable amounts. Shipping refundability is a configured policy. Cancelled prepaid orders may require refunds without a physical return. Restocking and money refund are separately idempotent and separately audited. COD refunds use an explicitly authorized payout channel and evidence rather than an invented online capture.

## 11 Identity and authorization

### Sessions

Use randomly generated opaque session secrets and persist only a digest. Browser sessions use `__Host-myshop_session` with Secure, HttpOnly, Path `/` and SameSite=Lax on each application host through its reverse proxy. Apply CSRF tokens and Origin checks to browser mutations. Mobile sends the session secret in Authorization and stores it in OS-protected secure storage; do not reuse AsyncStorage for credentials. An Expo-specific implementation must be checked against the project's SDK documentation when coded.

Proposed customer session limits are 30 days absolute and 7 days idle when remembered; unremembered browser sessions have no persistent cookie and a shorter server limit. Staff sessions have an 8-hour absolute limit and 30-minute idle limit with reauthentication for sensitive actions. Renew secrets on login and privilege change; enforce server expiry and revocation on every protected request. Use no shared parent-domain cookie between storefront and admin. These are MyShop policies informed by the [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

Hash passwords with Argon2id using a maintained implementation and work factors benchmarked on the deployment hardware; preserve algorithm parameters for future upgrades. Never log credentials or store reversible password encryption. See [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

Registration creates only a customer identity. Staff accounts are invited by an administrator with explicit permissions. Admin login requires MFA; recovery codes are hashed. Sensitive permission grants and large refunds require reauthentication and may use a configured second-approver threshold.

### Recovery

Password-reset initiation always returns a generic response. Generate a cryptographic challenge with a short lifetime, store a keyed digest of the OTP, rate-limit by IP and normalized account identifier and cap attempts. Verification issues a single-use reset token bound to the challenge and user; client `verified: true` has no authority. Resend invalidates earlier codes. Successful reset consumes the token atomically and revokes existing sessions. Account/email verification uses a separate challenge purpose.

### Permission policy

| Principal | Allowed access |
| --- | --- |
| Guest | Public catalog/content, possession-bound cart, quote and own order capability |
| Customer | Own profile, addresses, cart, wishlist, orders, cancellations, returns and documents |
| Catalog staff | `catalog:read/write`, `content:read/write`; no settlement authority |
| Fulfillment staff | `orders:read`, `orders:fulfill`, limited customer delivery information |
| Support staff | `customers:read`, `orders:read`, `returns:review`; no unrestricted exports or refund settlement |
| Finance staff | `payments:read`, `refunds:approve`, `cod:record`, `documents:read`, finance reporting |
| Administrator | Permission administration and store configuration; all sensitive actions audited |

Staff remains a high-level role with scoped permissions. Customer-facing registration and profile endpoints reject role fields. Server queries include customer ownership predicates rather than fetching by ID and trusting the UI. Returning 404 for an inaccessible owned resource avoids revealing its existence.

Guest checkout uses a high-entropy capability bound to a guest cart/order and stored as a digest. Browser transport is an HttpOnly cookie; native transport is a bearer capability. It never permits lookup of other orders by email or human order number. Claiming a guest order requires proof of the original capability plus verified account ownership of the contact channel.

## 12 Events and asynchronous reliability

![Outbox delivery](diagrams/10-outbox.svg)

[Editable Mermaid source](diagrams/10-outbox.mmd)

Write outbox rows in the same transaction as domain changes. A dispatcher leases due rows, enqueues an event ID and records attempts. A crash before acknowledgement may enqueue duplicates. Each consumer records `(consumer_name, event_id)` and either performs SQL effects with that marker in one transaction or uses a stable provider operation key for external effects. A marker must not be marked complete before an external operation is known to have succeeded.

`dispatched_at` records transport acceptance, not business completion. A recovery sweep compares retained events against the configured required consumers and their completed receipts, re-enqueuing overdue incomplete deliveries even when dispatched_at is populated. Expired consumer leases can be reclaimed. Retain outbox events until required effects are resolved and the replay-retention period has elapsed; otherwise Redis loss after enqueue could silently lose work.

Events include `order.placed.v1`, `payment.captured.v1`, `payment.exception.v1`, `order.shipped.v1`, `return.inspected.v1`, `refund.succeeded.v1`, `catalog.changed.v1` and `storefront.published.v1`. Payloads carry event ID, aggregate ID/version, timestamp and minimal facts, not full customer profiles or credentials. Schema changes are additive or introduce a new event version.

Use bounded retries with exponential backoff and jitter. Exhausted jobs go to a failure queue with an operator-visible reason and replay command. Invoice generation uses a unique order/document/version key. Email sending may still duplicate when a provider accepts a send and loses the response; use provider idempotency when available and describe delivery as at least once rather than exactly once.

Run SQL-driven schedules for reservation expiry, unresolved payment/refund reconciliation, outbox recovery, abandoned payment initialization, expired challenge cleanup and reporting refresh. Lease tasks in PostgreSQL so multiple workers do not create uncontrolled duplicate work.

## 13 Reporting and documents

Admin reports query committed backend facts and return definitions, currency, timezone, freshness and date range. Use Asia/Dhaka for business-day boundaries and UTC for storage.

| Metric | Definition |
| --- | --- |
| Orders placed | Orders created in interval, with exclusions/status filters made explicit |
| Net settled collections | Confirmed captures plus confirmed COD collections minus successful refunds in interval; an operating measure, not an accounting revenue assertion |
| Open fulfillment | Pending and processing orders at query time |
| Top sellers | Delivered units minus accepted returned units over the selected delivery cohort/window |
| Customer lifetime collected | Confirmed collections minus successful refunds for the customer |
| Active sessions | Unexpired, unrevoked sessions seen within the chosen activity window, if displayed |

Do not copy mock dashboard dollar values or infer active visitors from authenticated sessions. A true visitor metric needs a separate privacy-aware analytics source. Avoid calling order value revenue without a business-approved recognition definition.

Generate invoices/receipts from immutable order snapshots and versioned store identity/tax configuration. Distinguish unpaid invoice from payment receipt. Allocate human document numbers transactionally with a unique constraint; do not use `Math.random()`. Refunds issue a linked credit document where required by the configured process. Store PDFs privately with checksum and version, and issue short-lived authorized URLs. Exports run asynchronously, have maximum size limits and expire after a defined retention window.

## 14 Security controls

Validate unknown request properties, enum values, pagination, file dimensions and array bounds. Use parameterized database queries. Apply HTTPS, explicit origin allowlists and security headers. Redact session/capability secrets, passwords, OTPs, addresses, payment tokens and provider signatures in logs. Audit staff mutations in the domain transaction; redact secrets from before/after snapshots.

Separate migration credentials from runtime database credentials. Runtime access has no schema-alter privilege. Keep provider secrets and encryption keys in a secret manager; never `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*`. Private buckets deny anonymous reads. Restrict outbound requests from provider and media adapters. Limit bulk exports to explicit permissions, record who downloaded them and expire generated files.

Use restrictive API body limits and rate limits with route-specific policies: authentication/recovery strict, catalog tolerant, checkout both account/cart and IP aware. Redis rate-limiter failure blocks sensitive auth/recovery operations or uses a conservative local fallback; it does not grant unlimited attempts. Shared customer data must never enter public CDN caches.

## 15 Deployment and operations

![Deployment](diagrams/08-deployment.svg)

[Editable Mermaid source](diagrams/08-deployment.mmd)

Use isolated development, staging and production databases, buckets, queues, identities and provider accounts. Developer environments run PostgreSQL, Redis, a local object-storage substitute and fake provider/email adapters. Production begins with two API instances, at least one restartable worker, managed PostgreSQL with backups/PITR and managed Redis. Database and Redis have no public inbound access.

Build one immutable image and run API or worker entrypoints. CI validates formatting/types, meaningful domain tests, API contracts, real-PostgreSQL integration and concurrency tests, then scans and builds the image. Apply backward-compatible migrations once through a release task before rolling the application. Use expand → backfill → switch → contract for breaking schema changes. Roll back application images only while the schema is compatible; do not automatically reverse financial data migrations.

Set a total connection budget: `api replicas × pool size + worker pools + migration/admin reserve < database limit`. Start with bounded pools, e.g. 10 per API instance, then tune through load tests. Keep liveness process-local; readiness checks PostgreSQL and schema compatibility. Redis availability is reported separately: SQL order commits and public catalog can remain available, while affected asynchronous or abuse-sensitive operations degrade explicitly.

### Operational failure policy

| Failure | Behavior and recovery |
| --- | --- |
| PostgreSQL unavailable | Readiness fails; writes return retryable 503; never acknowledge an uncommitted order |
| Redis unavailable | Fall back to DB catalog reads; preserve outbox; delayed jobs resume after recovery; protect auth with conservative fallback |
| Provider timeout | Persist unknown state, prevent duplicate attempt and reconcile by stable reference |
| Worker unavailable | Orders remain durable; monitor backlog and resume from SQL tasks/outbox |
| Email unavailable | Retry notification; show confirmation in order history without claiming delivery |
| Object storage unavailable | Checkout continues if no file dependency; document task retries; downloads return clear unavailable state |
| Courier unavailable | Keep fulfillment at processing with allocation; retry booking without duplicate shipments |
| Poison callback/job | Isolate event, alert operators and preserve redacted diagnostic reference |
| Stale cache | Bounded TTL and publish invalidation; checkout reads authoritative data regardless |

### Monitoring and runbooks

Propagate a server-issued request ID and trace context through API, SQL and jobs. Log event/attempt/order IDs with duration and outcome. Track p50/p95/p99 latency, error rate, connection saturation, slow queries, deadlocks, inventory invariant violations, oldest outbox age, queue age, payment exceptions, refund unknown age and notification failures. Alert immediately on negative stock or duplicate settlement; page on sustained checkout failures and exhausted DB connections.

Maintain runbooks for provider outage, payment captured after expiry, stuck refund, replay of failed jobs, inventory discrepancy, database restore and leaked credentials. Operators reconcile against provider/courier evidence; they never repair financial state by editing totals directly in SQL.

Encrypt backups, enable point-in-time recovery and copy critical backups outside the primary failure domain. Perform a staging restore at least monthly and record measured RPO/RTO. Recovery must include outbox replay and payment/courier reconciliation after restore, since external money movement may be newer than restored SQL state. Define separate retention for orders/financial documents, security events, raw callbacks and exports before launch; do not invent a statutory period.

### Capacity and evolution

Scale API and worker concurrency independently after measuring SQL contention and provider limits. Add catalog caching and indexes before introducing another database. Paginate every list; use asynchronous bounded exports. Consider a read replica only when reporting contention is measured, and keep read-after-write order/payment reads on the primary. Extract search, notifications or media first if needed; keep order/inventory consistency together until there is a clear partitioning strategy.

Hosting cost is not priced here because region, provider, media volume and retention are undecided. Budget categories are runtime, managed database/backup, Redis, object storage/CDN egress, observability, email/SMS and transaction-provider fees. A fixed monthly number would conceal these inputs.

## 16 Decisions that remain configurable

| Decision | Proposed baseline | Required before |
| --- | --- | --- |
| Payment provider | Adapter plus COD; enable online methods after sandbox certification | Online checkout release |
| Shipping and courier | Single warehouse and one shipment; versioned zone/rate rules | Checkout release |
| Tax treatment | No production rate inferred from UI | Production quoting |
| Return policy | Configured window, reasons and inspection rules | Returns release |
| Guest checkout | Supported with order capability; account linking requires proof | Guest checkout release |
| Staff access | Scoped Staff permissions; Admin MFA | Admin rollout |
| Promotions | One code, no stacking at launch; transactional usage limits | Promotion activation |
| Refund approval | Finance permission; optional second approval by threshold | Refund release |
| Data retention | Purpose-specific schedule and approved document retention | Production launch |

These choices can be resolved without replacing the architecture. Implementation sequencing and executable acceptance requirements are in [Implementation plan](IMPLEMENTATION-PLAN.md).
