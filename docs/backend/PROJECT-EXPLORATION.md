# MyShop Project Exploration

Review date: 21 October 2026. Scope: the three applications, their route inventory, domain types, data sources, state management, service adapters, checkout and administration flows, package manifests, existing documentation and mobile tests. This is a source review, not a running application audit or a security penetration test.

## Repository structure

| Project | Declared stack | Current role |
| --- | --- | --- |
| `my-shop-front-end` | Next.js 16.1.6, React 19.2.3, TypeScript, Tailwind CSS, Zustand, Zod | Customer web storefront |
| `my-shop-admin-dashboard` | Next.js 16.2.4, React 19.2.4, TypeScript, Tailwind CSS, shadcn and Radix UI, Zod | Administration UI |
| `my-shop-mobile` | Expo ~57.0.30, React Native 0.86.3, Expo Router, TanStack Query, React Hook Form, Zod | Customer mobile app and browser preview |

Versions above are declared in repository manifests, not independently verified platform compatibility claims. Each application has its own pnpm lockfile. There is no backend package, database migration, ORM schema or implemented API handler in the reviewed source inventory. The only `fetch` match in the application source search is a commented settings example.

The root [plan](../../plan.md) marks UI phases complete. That completion describes frontend work; it does not establish persistent product management, real authentication, payment processing or synchronization between applications.

## Customer web storefront

Routes cover home, shop, men, women, new arrivals, product details by slug, cart, wishlist, checkout, login and signup.

| Area | Current behavior | Source |
| --- | --- | --- |
| Catalog | Static products and helper functions for filtering and slug lookup | [mockData.ts](../../my-shop-front-end/src/lib/mockData.ts) |
| Product model | Product-level SKU, price, stock, sizes and optional colors; ratings and review count; optional video | [product.type.ts](../../my-shop-front-end/src/types/product.type.ts) |
| Cart and wishlist | Zustand persisted browser state containing product objects | [store.ts](../../my-shop-front-end/src/lib/store.ts) |
| Cart identity | Add, update and remove match product ID plus size; selected color is not part of identity | [store.ts](../../my-shop-front-end/src/lib/store.ts) |
| Checkout | Local prices, simulated 10% tax, delayed success and cart clearing; no order submission | [checkout page](../../my-shop-front-end/src/app/checkout/page.tsx) |
| Payment UI | Card, bKash, Nagad and COD options; card number, expiry and CVC input UI | [checkout page](../../my-shop-front-end/src/app/checkout/page.tsx) |
| Authentication | Login and signup forms prevent default submission without account APIs | [login](../../my-shop-front-end/src/app/login/page.tsx), [signup](../../my-shop-front-end/src/app/signup/page.tsx) |
| Store content | Static hero, collection, category and newsletter components | `src/components/home/` |

The current product object is useful for presentation but cannot identify separately stocked size/color combinations. Production clients must submit a variant ID and quantity; copied product prices cannot establish an order amount.

## Admin dashboard

Routes cover dashboard overview, products, categories, orders, customers, returns, invoices, storefront settings, general settings and login.

| Area | Current behavior | Source |
| --- | --- | --- |
| Data sources | `getFakeData()` returns imported JSON; orders have a separate JSON fixture | [data.ts](../../my-shop-admin-dashboard/src/lib/data.ts), [fake.json](../../my-shop-admin-dashboard/src/data/fake.json), [orders.json](../../my-shop-admin-dashboard/src/data/orders.json) |
| Products | Table uses fake data; form includes media, tags, sizes, colors, category, featured and new flags | [products page](../../my-shop-admin-dashboard/src/app/(protcted-route)/products/page.tsx), [ProductForm](../../my-shop-admin-dashboard/src/components/products/ProductForm.tsx) |
| Orders | Creation, edit, status update and return handlers update React state | [orders page](../../my-shop-admin-dashboard/src/app/(protcted-route)/orders/page.tsx) |
| Manual orders | Creation accepts a total and immediately sets Processing and Paid | Same orders page and [validation](../../my-shop-admin-dashboard/src/lib/validations/order.ts) |
| Customers | Fake CRM records and customer detail sheet | [customers page](../../my-shop-admin-dashboard/src/app/(protcted-route)/customers/page.tsx), [CustomerDetailsSheet](../../my-shop-admin-dashboard/src/components/shared/CustomerDetailsSheet.tsx) |
| Returns | Derives returned/cancelled rows from fake orders and adds a mock return date | [returns page](../../my-shop-admin-dashboard/src/app/(protcted-route)/returns/page.tsx) |
| Invoices | Download handler displays a toast; no generated PDF | [invoices page](../../my-shop-admin-dashboard/src/app/(protcted-route)/invoices/page.tsx) |
| Storefront | Banner and announcement editing in component state; save logs values and displays success | [storefront page](../../my-shop-admin-dashboard/src/app/(protcted-route)/storefront/page.tsx) |
| Settings | Save logs values; intended API call is commented out | [settings page](../../my-shop-admin-dashboard/src/app/(protcted-route)/settings/page.tsx) |
| Login | User selects Admin, Staff or Customer; delay then redirect, without credential verification | [login page](../../my-shop-admin-dashboard/src/app/login/page.tsx), [role types](../../my-shop-admin-dashboard/src/types/auth.ts) |
| Protected layout | Renders sidebar and page content without a server session check | [layout](../../my-shop-admin-dashboard/src/app/(protcted-route)/layout.tsx) |
| Analytics | Fake monetary values, counts and graphs | `src/data/fake.json`, `src/components/my-dashboard.tsx` |

## Mobile storefront

Expo Router separates authentication routes, tab routes, product/checkout/order stack routes and account routes. Feature screens and hooks live outside the route directory.

| Area | Current behavior | Source |
| --- | --- | --- |
| Catalog service | Async adapter returns bundled `MOCK_PRODUCTS` | [catalogService](../../my-shop-mobile/src/services/catalogService.ts) |
| Query layer | Catalog query key identifies preview data | [useCatalog](../../my-shop-mobile/src/hooks/useCatalog.ts) |
| Remaining static reads | Product details, related products and wishlist read bundled products directly | `src/feature/(module)/product/ProductScreen.tsx`, `src/feature/(module)/wishlist/WishlistScreen.tsx` |
| Auth service | Preview profile creation; fixed OTP `123456`; no requests, password verification or credential update | [authService](../../my-shop-mobile/src/services/authService.ts) |
| Auth contract | Service returns `PreviewSession`; challenge state includes a client-side verified flag | [auth types](../../my-shop-mobile/src/types/auth.ts) |
| State persistence | Shop state and preview session persist separately using versioned local storage | `src/providers/`, `src/store/shopStorage.ts`, `src/lib/storage.ts` |
| Cart identity | Product ID, size and color; quantity checks share product stock across variants | [reducer](../../my-shop-mobile/src/store/shopReducer.ts), [commerce utilities](../../my-shop-mobile/src/utils/commerce.ts) |
| Checkout | Creates local preview receipt; mutation clears cart and navigates to receipt | [useCheckout](../../my-shop-mobile/src/feature/(module)/checkout/hooks/useCheckout.ts), [orderService](../../my-shop-mobile/src/services/orderService.ts) |
| Account | Local profile, address book and email-matched receipt history | `src/feature/(module)/account/`, `src/feature/(module)/orders/` |
| Newsletter | Stores submitted email locally | `src/store/shopReducer.ts` |
| Catalog maintenance | Development script copies web types, mock catalog and images | [sync script](../../my-shop-mobile/scripts/sync-catalog.cjs) |
| Existing checks | Domain tests and Playwright browser flows | [commerce tests](../../my-shop-mobile/tests/commerce.test.cjs), [browser tests](../../my-shop-mobile/tests/e2e/shop.spec.ts) |

The [mobile README](../../my-shop-mobile/README.md) correctly describes these preview boundaries. Replacing `catalogService.list()` alone will not migrate the mobile catalog: direct imports in product details, wishlist and related-product paths must also change.

## Model conflicts that the backend must resolve

| Conflict | Evidence | Design consequence |
| --- | --- | --- |
| Product stock cannot distinguish variants | All product interfaces use `stock`, `sizes[]`, `colors[]` | Introduce variant rows and inventory balances |
| Web cart merges different colors | Zustand keys omit selected color | Replace client tuple keys with `variantId` |
| Product flags diverge | Admin has `isFeatured` and `isNew`; storefront type uses tags | Canonical flags plus explicit merchandising labels; map once in adapters |
| Categories have inconsistent meaning | Admin fixtures use Mens Fashion/Womens Fashion; storefront uses shirt/pants and separate gender | Category IDs and slugs independent of gender |
| Currency and price types diverge | Admin fake data has dollar-formatted strings; storefront uses BDT numeric display | BDT integer minor units in all APIs; formatting only in clients |
| Order statuses diverge | Admin type omits Returned, while returns UI checks it | Separate fulfillment, payment and return lifecycles |
| Payment statuses diverge | Type allows Paid/Unpaid/Pending; fixture includes Refunded | Explicit payment and refund models |
| Order content is incomplete | Admin `items` is a count; mobile includes mutable product objects | Immutable order-line and address snapshots |
| Identity is local | Preview profile ID is shared and receipts are matched by email | Server-issued identity; authorize by immutable customer ID |
| Marketing consent is implicit | Web checkboxes and mobile local subscription | Store consent purpose/source/time and verify subscriptions |
| Best seller sorting is synthetic | Mobile uses review count; newest uses numeric product ID | Aggregate delivered quantities; newest uses `publishedAt` |

## Functional backend scope

Launch requires identity and recovery, catalog and merchandising, SKU inventory, cart/wishlist, addresses, priced checkout, COD, a provider adapter for online payment, order fulfillment, tracking, returns and refunds, invoices, customer management, storefront publishing, newsletter consent, auditable administration and operational monitoring.

Existing UI suggests reviews, social login and marketing campaigns, but there is no implemented review or social authentication backend. Review submission/moderation, social identity, loyalty, recommendations, multiple warehouses and multiple currencies are extensions rather than required launch infrastructure.

## Exploration boundaries

No application source was modified for this design. The review did not run user journeys, load tests, native device tests or existing application test suites. Backend correctness requirements and acceptance tests are specified in the implementation plan; they are not claims that those features already work.
