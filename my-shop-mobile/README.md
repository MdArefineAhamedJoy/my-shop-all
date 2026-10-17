# MYSHOP mobile

React Native + Expo storefront with the existing MYSHOP catalog, photos and orange/white brand. The project follows the Guardly reference's route/feature separation, auth screens, shared primitives, providers and service boundaries. It retains this project's Expo SDK 57 rather than copying Guardly's SDK 54 dependencies.

## Start

Requirements: Node.js 22.13+ and pnpm 10.17.1.

```powershell
cd D:\personal\my-shop\my-shop-mobile
pnpm install --frozen-lockfile
pnpm start
```

Scan the QR code with a compatible Expo Go client. Phone and computer must share a network. Use `pnpm exec expo start --tunnel` if LAN access is unavailable. Browser preview: `pnpm web`. Android emulator: `pnpm android`. An iOS Simulator requires macOS.

## Project structure

```text
src/
  app/                      Route exports and navigation only
    (auth)/                 Login, registration, recovery and verification
    (module)/
      (tabs)/               Home, Shop, Wishlist, Bag, Account
      (stack)/              Product details, checkout, order receipt
    (account)/              Protected profile, addresses and order history
  feature/
    (auth)/                 Form screens, schemas and auth mutation hooks
    (module)/               Screens with collocated components and hooks
  components/
    auth/                   Shared session guard with explicit return routes
    ui/                     Text, Button, Input, FormField, Chip, BottomSheet
    layout/                 Screen, AppHeader, Brand, SectionHeading, loading
    commerce/               Product cards/lists, quantity, order summary
    forms/                  Shared address fields
  constants/                Colors, font names, dimensions, storage keys
  config/                   Explicit frontend preview mode
  data/                     Storefront content and copied website catalog
  hooks/                    Catalog, responsive, shop and session hooks
  lib/                      Typed local storage utility
  providers/                Fonts, Query, Session, Shop and root composition
  schemas/                  Shared address validation
  services/                 Typed frontend adapters; replace when APIs exist
  store/                    Shop reducer/context and persisted validation
  types/                    Shared domain interfaces
  utils/                    Pure commerce, IDs and navigation helpers
```

Route files export feature screens. Screens compose smaller components; forms, validation and mutations live in their own modules. Auth state is separate from cart/wishlist state. Bundled Inter fonts, color tokens and shared primitives keep typography and controls consistent.

## Auth flow

```text
Login <-> Create account
  |
  +-> Forgot password -> OTP -> New password -> Success -> Login

Guest -> protected screen -> Login -> requested screen
Account -> Sign out confirmation -> guest account screen
```

Login includes email/password validation, visibility toggle and remember me. Registration includes confirmation and consent. Recovery includes a six digit code, resend cooldown, expiry and password confirmation. Entering verification/reset without a challenge returns to recovery. Login restores only an allowlisted in-app destination.

## Frontend preview boundaries

**There is no backend implementation or live API connection.** The app is prepared for UI review and frontend integration work.

- A valid email and a password of at least 8 characters opens a **preview session**. Credentials are not verified and no account is created. Use sample passwords while reviewing the UI.
- Passwords are never stored or sent. Remember me saves only the preview profile; no fake token is created. Without remember me, the session ends on reload.
- The preview verification code is **123456**. No email is sent. Resetting a password completes the frontend flow; no credential is changed.
- Cart, wishlist, address book, newsletter email and receipts are saved locally. Session and shopping state use separate versioned storage keys. Invalid saved data produces a visible message.
- Catalog and banner photos are bundled. The sample product video needs internet access.
- Checkout previews card/bKash/Nagad/COD options and the website's estimated 10% tax. It collects no payment credentials, charges no money and submits no order to the dashboard.
- Order history shows local receipts matching the preview profile's email. Route guards organize the UI; eventual server APIs must enforce real authorization.

Replace the `AuthService` and `CatalogService` implementations in `src/services/` after backend contracts are designed. Add server order submission at the checkout hook boundary. Prices, stock, payments, identity and order access must then be validated on the server. No backend framework or endpoint paths have been assumed.

## Formatting and checks

Prettier matches the reference: two spaces, double quotes, semicolons, 80 columns and LF. VS Code format-on-save and EditorConfig are included. Use pnpm consistently; `pnpm-lock.yaml` is the only dependency lockfile.

```powershell
pnpm format
pnpm validate
pnpm test:e2e
pnpm dlx expo-doctor
pnpm exec expo export --platform all --max-workers 2
```

`validate` runs TypeScript, ESLint, formatting checks and domain tests. Browser tests use installed Google Chrome and start a server on port 8085. Run browser suites sequentially. Screenshots go to `test-results/`. Native bundle export does not replace device testing.

```powershell
pnpm sync:catalog
node scripts/cache-remote-images.cjs
```

These development scripts copy the website catalog/types, cache added remote photos and generate a formatted static image map. The app runs independently of Next.js.

## Native build preparation

An EAS preview APK profile is included. Add your Android package and iOS bundle identifiers and configure your own Expo project before signing/distribution. These source changes do not sign an APK or submit to a store.

The Expo dependency tree has upstream audit advisories. Review them before production; forced fixes that select incompatible SDK versions should not replace SDK compatibility checks.
