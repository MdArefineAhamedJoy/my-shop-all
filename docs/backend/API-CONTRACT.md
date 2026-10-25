# MyShop API Contract

Proposed REST contract for all three clients. Production origin is to be configured; examples use `/v1`. Browser reverse proxies expose `/api/v1` and forward to `/v1`. This is a human-readable contract inventory, not a generated OpenAPI specification or implemented endpoint collection.

## Common rules

JSON request and response properties use camelCase; database fields use snake_case. IDs are UUID strings except human-facing order/document numbers. Money is an integer minor-unit amount with `currency: "BDT"`. Timestamps are ISO 8601 UTC. Unknown mutable fields are rejected. Return only DTO fields, never raw ORM rows.

Successful resource responses use `{ "data": ..., "meta": { "requestId": "..." } }`. A list adds `nextCursor`, `hasMore` and optional `totalCount` to `meta`. Counts are omitted unless requested and feasible. A DELETE may return 204 without an envelope.

```json
{
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "One or more items are unavailable.",
    "details": [{ "variantId": "variant-uuid", "availableQuantity": 0 }]
  },
  "meta": { "requestId": "server-generated-request-id" }
}
```

| Status | Meaning |
| --- | --- |
| 400 | Invalid shape, unknown field or malformed cursor |
| 401 | Missing, expired or revoked authentication/capability |
| 403 | Authenticated principal lacks a staff permission |
| 404 | Missing resource or owned resource inaccessible to caller |
| 409 | State conflict, stale version, stock conflict, quote changed or idempotency mismatch |
| 410 | Expired one-time quote/challenge when revealing existence is safe |
| 422 | Well-shaped command violates a supported business policy |
| 429 | Rate limit, with Retry-After |
| 503 | Dependency unavailable; retry only according to operation/idempotency policy |

List endpoints accept `limit` default 20, maximum 100 and an opaque cursor tied to normalized filters and sort. Sort keys use a stable ID tie-breaker. Orders default to `createdAt desc, id desc`; products default to an explicit merchandising order. Customer/financial responses use `Cache-Control: private, no-store`. Public catalog/content may use short public caching and ETags.

### Access notation

`Public` needs no user identity. `Guest` needs the cart/order capability. `Customer` needs a session and ownership. `Staff(permission)` needs an authenticated staff session, applicable permission and resource restrictions. Browser session mutations also need CSRF and Origin checks. Native bearer calls do not use cookie-based CSRF.

Staff and customer sessions are issued by the server. A submitted role never changes authority. Capability possession is not interchangeable with email or order-number knowledge.

## Identity and recovery

| Method and path | Access | Input and result |
| --- | --- | --- |
| POST `/auth/register` | Public, rate limited | name, email, password, acceptedTermsRevision → customer and verification challenge; never accepts role |
| POST `/auth/login` | Public, rate limited | email, password, remember, clientType → session, user and permissions or MFA challenge |
| POST `/auth/mfa/verify` | Bound login challenge | challengeId, code/assertion → staff session |
| POST `/auth/logout` | Session | Revoke current session, clear cookie |
| GET `/auth/session` | Session | Principal, permissions, expiresAt and browser CSRF token |
| GET `/auth/sessions` | Session | Own session/device summary without secrets |
| DELETE `/auth/sessions/{sessionId}` | Session owner | Revoke chosen session |
| POST `/auth/password-reset/request` | Public, rate limited | email → generic 202 and opaque challenge handle; do not disclose account existence |
| POST `/auth/password-reset/resend` | Bound challenge | challengeId → generic 202; invalidate previous code |
| POST `/auth/password-reset/verify` | Bound challenge | challengeId, code → short-lived single-use resetToken |
| POST `/auth/password-reset/complete` | Reset token | resetToken, newPassword → 204 and revoke prior sessions |
| POST `/auth/email-verification/request` | Customer | Generic delivery acknowledgement |
| POST `/auth/email-verification/complete` | Bound challenge | challengeId, code → verification result |
| PUT `/me/password` | Session, reauthenticated | currentPassword, newPassword → update and revoke other sessions |
| POST `/me/mfa/enrollment` | Staff, reauthenticated | Begin credential enrollment |
| POST `/me/mfa/enrollment/confirm` | Staff, bound enrollment | Proof → enable MFA and one-time recovery codes |
| DELETE `/me/mfa/{credentialId}` | Staff, reauthenticated | Enforce policy; administrators cannot remove last required MFA factor |
| POST `/staff/invitations/accept` | Invitation proof | token, verified email proof, name, password → invited staff enrollment; MFA required before activation |

Browser login sets the host-only HttpOnly session cookie and never returns its secret to JavaScript. Native login returns the bearer session secret once for secure OS storage. Responses containing secrets are never cached or logged. MFA challenge IDs are short lived and bound to the attempted login, with their own attempt cap.

## Customer profile and shopping

| Method and path | Access | Input and result |
| --- | --- | --- |
| GET `/me` | Customer | Own profile |
| PATCH `/me` | Customer | name, phone, expectedVersion; email changes require a separate verified workflow |
| GET `/me/addresses` | Customer | Owned saved addresses |
| POST `/me/addresses` | Customer | Address DTO and label → saved address |
| PATCH `/me/addresses/{addressId}` | Owner | Allowed address fields, expectedVersion |
| DELETE `/me/addresses/{addressId}` | Owner | Delete saved address, preserve order snapshots |
| PUT `/me/addresses/{addressId}/default` | Owner | Atomically select default |
| POST `/carts` | Public | Create guest cart, issue capability through secure transport |
| GET `/cart` | Customer or Guest | Current cart, variant projections and adjustments |
| PUT `/cart/items/{variantId}` | Customer or Guest | quantity, expectedCartVersion → absolute quantity; creates or replaces item |
| DELETE `/cart/items/{variantId}` | Customer or Guest | expectedCartVersion → remove item |
| DELETE `/cart/items` | Customer or Guest | Clear cart |
| POST `/cart/merge` | Customer plus guest proof | guestCartId, guest capability through transport, expectedVersion → merged cart and adjustments |
| GET `/me/wishlist` | Customer | Paginated product projections |
| PUT `/me/wishlist/{productId}` | Customer | Idempotently add |
| DELETE `/me/wishlist/{productId}` | Customer | Idempotently remove |
| POST `/me/wishlist/merge` | Customer | Bounded productIds array → merged items and missing IDs |
| POST `/newsletter/subscriptions` | Public, rate limited | email, consentPolicyRevision, source → generic 202 double opt-in acknowledgement |
| POST `/newsletter/confirm` | Subscription token | token → activated subscription |
| POST `/newsletter/unsubscribe` | Purpose-bound token or owner | token/proof → opt-out; repeated requests succeed |

Use absolute quantity updates so network retry does not accidentally increment a cart twice. Guest capabilities are never sent in URLs or ordinary JSON logs. Browser merge reads an appropriate same-origin guest cookie; native merge passes a dedicated capability header. A verified login does not automatically claim all orders using the same email.

## Public catalog and content

| Method and path | Access | Filters and result |
| --- | --- | --- |
| GET `/products` | Public | q, category, gender, collection, tag, size, color, minPriceMinor, maxPriceMinor, sort, cursor, limit |
| GET `/products/{slug}` | Public | Published detail, approved media, variants and availability; resolves slug aliases |
| GET `/products/{productId}/related` | Public | Bounded related product projections |
| GET `/categories` | Public | Ordered active tree |
| GET `/collections` | Public | Active collection metadata |
| GET `/storefront` | Public | Published banners, announcement, contact/social links, collections and revision |
| GET `/checkout/options` | Public | Enabled methods, delivery-country/zone requirements and current public policy revision |

Product sorts: `featured`, `price-asc`, `price-desc`, `newest`, `oldest`, `best-selling`. Newest uses publication time. Best-selling declares its aggregation window. Price filters and sorting apply to sellable variants, not an arbitrary inactive variant. Facets describe the filtered product set with documented behavior. Bound q length and filter list sizes.

```json
{
  "data": {
    "id": "product-uuid",
    "slug": "classic-cotton-shirt",
    "name": "Classic Cotton Shirt",
    "gender": "men",
    "category": { "id": "category-uuid", "slug": "shirt", "name": "Shirts" },
    "currency": "BDT",
    "priceFromMinor": 129900,
    "isFeatured": true,
    "isNew": false,
    "tags": ["premium"],
    "images": [{ "url": "https://cdn.example.com/products/shirt.webp", "alt": "Navy cotton shirt" }],
    "variants": [
      {
        "id": "variant-uuid",
        "sku": "SHIRT-NAVY-M",
        "size": "M",
        "color": "navy",
        "priceMinor": 129900,
        "compareAtMinor": 149900,
        "availability": "in_stock",
        "maxOrderQuantity": 4
      }
    ],
    "version": 3
  },
  "meta": { "requestId": "request-uuid" }
}
```

IDs in examples are descriptive placeholders. `maxOrderQuantity` is a bounded current hint, not a promise that checkout stock is reserved. Public DTOs do not need to expose exact warehouse counts.

## Checkout and customer orders

| Method and path | Access | Input and result |
| --- | --- | --- |
| POST `/checkout/quotes` | Customer or Guest | cartVersion, shippingAddress/addressId, billingAddress optional, paymentMethod, promotionCode optional → priced quote |
| POST `/orders` | Customer or Guest, idempotent | quoteId → durable order plus payment action/state; 201 or replayed original response |
| GET `/me/orders` | Customer | Own paginated orders and optional status/date filter |
| GET `/orders/{orderId}` | Owner or bound Guest | Immutable lines/totals/address, status, payment summary and tracking |
| GET `/orders/{orderId}/payment-action` | Owner or bound Guest | initializing/pending/none, allowlisted redirect URL and expiry |
| POST `/orders/{orderId}/payment-attempts` | Owner or bound Guest, idempotent | Reinitialize only after prior attempt is conclusively terminal and order still eligible |
| POST `/orders/{orderId}/cancel` | Owner or bound Guest, idempotent | reason, expectedVersion → cancellation or conflict |
| POST `/orders/{orderId}/claim` | Customer plus original guest proof | Verified contact matches order, capability → attach ownership atomically |
| GET `/orders/{orderId}/tracking` | Owner or bound Guest | Normalized shipment timeline |
| GET `/orders/{orderId}/documents` | Owner or bound Guest | Available invoice/receipt metadata |
| POST `/documents/{documentId}/download` | Owner or authorized Staff | Short-lived private download URL; audit staff download |
| POST `/orders/{orderId}/returns` | Customer owner, idempotent | line IDs, quantities, reason, evidence IDs → return request |
| GET `/returns/{returnId}` | Customer owner | Return decisions, quantities and linked refund status |

Guest returns require an account claim first at launch, so support and refund identity have an authenticated owner. Guest order capabilities remain sufficient for viewing, payment completion and eligible cancellation.

### Quote example

```json
{
  "cartVersion": 4,
  "shippingAddress": {
    "firstName": "Sample",
    "lastName": "Customer",
    "email": "customer@example.com",
    "phone": "+8801700000000",
    "line1": "Sample road",
    "city": "Dhaka",
    "region": "Dhaka",
    "postalCode": "1207",
    "countryCode": "BD"
  },
  "paymentMethod": "cod"
}
```

Illustrative response totals, using a hypothetical configured rate rather than a production tax assertion:

```json
{
  "data": {
    "id": "quote-uuid",
    "expiresAt": "2026-10-21T12:05:00Z",
    "currency": "BDT",
    "lines": [
      { "variantId": "variant-uuid", "quantity": 2, "unitPriceMinor": 129900, "subtotalMinor": 259800, "discountMinor": 0, "taxMinor": 0, "totalMinor": 259800 }
    ],
    "totals": { "subtotalMinor": 259800, "discountMinor": 0, "shippingMinor": 8000, "taxMinor": 0, "totalMinor": 267800 },
    "rulesVersion": "policy-revision-uuid",
    "stockReserved": false
  },
  "meta": { "requestId": "request-uuid" }
}
```

### Placement example

```http
POST /v1/orders
Content-Type: application/json
Idempotency-Key: 85ae5c89-c6fc-47d2-8e80-d433c8a15d54

{"quoteId":"quote-uuid"}
```

```json
{
  "data": {
    "id": "order-uuid",
    "orderNumber": "MS-20261021-000123",
    "status": "pending",
    "paymentStatus": "unpaid",
    "paymentMethod": "cod",
    "currency": "BDT",
    "totalMinor": 267800,
    "paymentAction": { "status": "none" },
    "version": 1
  },
  "meta": { "requestId": "request-uuid" }
}
```

Online placement returns `status: awaiting_payment`, a pending payment summary and `paymentAction.status: initializing` or `redirect` with a provider URL. The placement response records durable intent; only verified settlement changes payment to paid.

## Admin catalog, inventory and content

| Method and path | Permission | Command or result |
| --- | --- | --- |
| GET `/admin/products` | catalog:read | Draft/published/archived products with admin filters |
| POST `/admin/products` | catalog:write | Create draft product and explicit variants |
| GET `/admin/products/{id}` | catalog:read | Full editable DTO and version |
| PATCH `/admin/products/{id}` | catalog:write | Descriptive fields/flags, expectedVersion |
| POST `/admin/products/{id}/publish` | catalog:write | Validate complete sellable data and publish |
| POST `/admin/products/{id}/archive` | catalog:write | Hide from new purchases without deleting history |
| POST `/admin/products/{id}/variants` | catalog:write | SKU, size, color, priceMinor, compareAtMinor |
| PATCH `/admin/variants/{id}` | catalog:write | Price/activity fields and expectedVersion; no direct balance overwrite |
| GET `/admin/categories` | catalog:read | Category management tree |
| POST `/admin/categories` | catalog:write | Create category |
| PATCH `/admin/categories/{id}` | catalog:write | Rename/reorder/parent with cycle check |
| DELETE `/admin/categories/{id}` | catalog:write | Only if unreferenced; otherwise 409 |
| POST `/admin/collections` | content:write | Create collection |
| PATCH `/admin/collections/{id}` | content:write | Curated members/rule and ordering |
| GET `/admin/inventory` | inventory:read | On-hand, held, allocated and available by SKU |
| GET `/admin/inventory/{variantId}/movements` | inventory:read | Paginated append-only movement history |
| POST `/admin/inventory/adjustments` | inventory:adjust, idempotent | variantId, signed quantity, reason, expectedVersion |
| POST `/admin/media/upload-intents` | catalog:write or content:write | MIME/size/checksum → signed quarantine upload |
| POST `/admin/media/{assetId}/complete` | Asset owner and staff permission | Verify upload and queue validation; 202 |
| GET `/admin/media/{assetId}` | Appropriate staff permission | Validation status and approved derived URLs |
| GET `/admin/storefront` | content:read | Current draft and published revisions |
| PUT `/admin/storefront/draft` | content:write | Bounded public configuration and expectedVersion |
| POST `/admin/storefront/publish` | content:write | Draft revision → atomic publish and cache invalidation |
| GET `/admin/settings` | settings:read | Redacted settings, enabled methods, references to secrets |
| PATCH `/admin/settings` | settings:write, reauthenticated | Explicit allowed fields and expectedVersion |
| POST `/admin/pricing-policies` | settings:write, reauthenticated | Create validated immutable draft policy |
| POST `/admin/pricing-policies/{id}/publish` | settings:write, reauthenticated | Activate version; invalidate incompatible quotes |
| POST `/admin/promotions` | promotions:write | Create single-code discount rule |
| PATCH `/admin/promotions/{id}` | promotions:write | Eligibility/limits/activity, expectedVersion |

Customer return-evidence uploads use a separate purpose-bound `/me/media/upload-intents` and `/me/media/{id}/complete` pair. They accept only private evidence MIME types, limits and order ownership; they cannot create public product assets.

## Admin orders, customers and finance

| Method and path | Permission | Command or result |
| --- | --- | --- |
| GET `/admin/orders` | orders:read | Filtered, paginated order projections |
| GET `/admin/orders/{id}` | orders:read | Detail with permission-based PII/finance fields |
| POST `/admin/checkout/quotes` | orders:create | Customer/contact, variant quantities, delivery, method → server-priced quote |
| POST `/admin/orders` | orders:create, idempotent | quoteId, reason → same placement invariants and staff actor; never accepts total or paid status |
| PATCH `/admin/orders/{id}/shipping-contact` | orders:edit | Permitted contact correction before shipment; expectedVersion and reason |
| POST `/admin/orders/{id}/notes` | orders:read plus notes:write | Body and visibility |
| POST `/admin/orders/{id}/process` | orders:fulfill | expectedVersion → processing |
| POST `/admin/orders/{id}/ship` | orders:fulfill, idempotent | courier, tracking/booking reference, expectedVersion → one full shipment |
| POST `/admin/orders/{id}/deliver` | orders:fulfill, idempotent | Evidence and expectedVersion; does not mark COD paid |
| POST `/admin/orders/{id}/cancel` | orders:cancel, idempotent | Reason, expectedVersion; release stock and initiate needed refund |
| GET `/admin/customers` | customers:read | Search/filter with bounded PII |
| GET `/admin/customers/{id}` | customers:read | Profile and computed order/collection summary |
| GET `/admin/customers/{id}/orders` | orders:read | Customer-scoped order history |
| POST `/admin/customers/{id}/notes` | customers:write | Internal support note and audit |
| GET `/admin/returns` | returns:read | Return queue |
| POST `/admin/returns/{id}/approve` | returns:review | Per-line approved quantities, reason, expectedVersion |
| POST `/admin/returns/{id}/reject` | returns:review | Reason, expectedVersion |
| POST `/admin/returns/{id}/receive` | returns:receive, idempotent | Received quantities and evidence |
| POST `/admin/returns/{id}/inspect` | returns:inspect, idempotent | Accepted/restock quantities, disposition and reason |
| POST `/admin/returns/{id}/close` | returns:review | All physical and required refund tasks resolved |
| GET `/admin/payments` | payments:read | Attempts, collections and exceptions |
| POST `/admin/payments/{id}/reconcile` | payments:reconcile, idempotent | Queue provider query, not arbitrary payment-state edit |
| POST `/admin/orders/{id}/cod-collections` | cod:record, idempotent | Amount, courier reference, evidence and collected/remitted dates |
| GET `/admin/refunds` | payments:read | Refund tasks and outcomes |
| POST `/admin/orders/{id}/refunds` | refunds:approve, reauthenticated, idempotent | Funding source, amount/lines, reason and optional returnId |
| POST `/admin/refunds/{id}/approve` | refunds:second-approve | Independent approver when policy threshold requires it |
| GET `/admin/documents` | documents:read | Invoice, receipt and credit-note metadata |
| POST `/admin/orders/{id}/documents` | documents:issue, idempotent | Kind/revision → durable generation task |
| GET `/admin/reports/overview` | reports:read | Bounded date range, metric definitions, currency, timezone, refreshedAt |
| POST `/admin/reports/exports` | reports:export, idempotent | Filtered bounded export job; 202 |
| GET `/admin/reports/exports/{id}` | Job owner or privileged staff | Status and short-lived download action |
| GET `/admin/audit-logs` | audit:read | Bounded entity/actor/time filters |
| GET `/admin/staff` | staff:manage | Staff and effective permissions |
| POST `/admin/staff/invitations` | staff:manage, reauthenticated | Email and assigned roles → private invitation delivery |
| PUT `/admin/staff/{id}/roles` | staff:manage, reauthenticated | Server-defined role IDs; protect last active administrator |
| POST `/admin/staff/{id}/disable` | staff:manage, reauthenticated | Disable identity and revoke sessions; protect last administrator |

The permission list is a seed policy, not a reason to give every Staff account all privileges. The existing three-role UI may display broad labels, but the server returns actual allowed actions.

## Integration and health endpoints

| Method and path | Access | Behavior |
| --- | --- | --- |
| POST `/webhooks/payments/{provider}` | Provider-authenticated | Verify adapter-specific proof, persist inbox event, dedupe and process/reconcile |
| POST `/webhooks/couriers/{provider}` | Provider-authenticated | Verify source, dedupe and record tracking facts |
| GET `/health/live` | Infrastructure | Process health only; no secrets |
| GET `/health/ready` | Infrastructure | Database/schema compatibility; bounded result without internal connection strings |
| GET `/metrics` | Private operations network | Metrics only, never public customer access |

Provider payloads are intentionally adapter-specific and are not interchangeable. Callback path knowledge is not authentication. Apply bounded body sizes and preserve exact raw bytes when signature verification requires them.

## Idempotency and concurrency contract

Require `Idempotency-Key` on placement, new payment attempts, cancellations, shipment, stock adjustment, refund, document issue and export creation. Scope keys by authenticated user or guest capability, HTTP operation and resource. Maximum key length is 128 characters; clients generate a cryptographically random UUID per intended operation and reuse it after transport failures.

Persist canonical input hash and response/resource ID. Same key/input returns the stored status and safe body; different input returns `409 IDEMPOTENCY_CONFLICT`. Concurrent in-flight duplicates wait briefly or receive `409 REQUEST_IN_PROGRESS` with Retry-After. Proposed retention is at least seven days for general commands; payment/refund operation identities and natural business uniqueness remain durable beyond that window. The unique order quote reference prevents re-placement of the same quote even with a new key.

Do not store expiring provider redirect URLs or raw capabilities as permanent replay secrets. Return durable identifiers/state and obtain refreshed authorized actions through dedicated endpoints. Replayed guest placement uses the existing guest transport binding.

Mutable staff commands accept `expectedVersion` and return the new version. A mismatch returns `409 VERSION_CONFLICT`; the client refetches and lets the operator review. No endpoint accepts a generic field patch that bypasses a lifecycle or financial invariant.

## Client migration rules

1. Generate versioned TypeScript DTOs from the eventual OpenAPI specification and put HTTP/error handling in per-client services. Do not import server ORM types into clients.
2. Display minor units by converting only at the formatting boundary. Preserve variant ID throughout cart, product selection and checkout.
3. Replace all mobile direct mock catalog imports as well as service adapters. Query keys include filters, product ID/slug and relevant identity scope.
4. Show durable order status after a payment redirect; never infer paid from URL query parameters.
5. Clear identity-scoped caches on logout/account switch. Keep any optimistic UI reversible and reconcile against server responses.
6. Explicitly version changes to route shape, monetary units and lifecycle enums. Deploy compatible clients before removing legacy representations.
