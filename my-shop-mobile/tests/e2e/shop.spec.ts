import { expect, test } from "@playwright/test";
const randomUUID = () => globalThis.crypto.randomUUID();
const base = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/v1";
test("live mobile account, variant, quote, COD order and sign out", async ({
  page,
}) => {
  const email = `mobile-${randomUUID()}@example.com`,
    password = `Mobile-${randomUUID()}`;
  await page.goto("/create-account", { waitUntil: "domcontentloaded" });
  for (const [label, value] of Object.entries({
    "Full name": "Mobile Customer",
    "Email address": email,
    Password: password,
    "Confirm password": password,
  }))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("checkbox").click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  const registration = page.waitForResponse(
    (r) =>
      r.url() === `${base}/auth/register` && r.request().method() === "POST"
  );
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  expect((await registration).status()).toBe(201);
  await page.getByRole("tab", { name: /Account/ }).click();
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true })
  ).toBeVisible();
  // Client navigation preserves memory-only web credentials; full page reload intentionally signs out.
  await page.getByRole("tab", { name: /Shop/ }).click();
  await page
    .getByRole("link", { name: "View Classic Cotton Shirt", exact: true })
    .click();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page
    .getByRole("button", { name: "View your bag", exact: true })
    .click();
  await page.getByRole("button", { name: /checkout/i }).click();
  for (const [label, value] of Object.entries({
    "First name": "Mobile",
    "Last name": "Customer",
    "Email address": email,
    "Street address": "House 10 Road 2",
    City: "Dhaka",
    "Postal code": "1207",
    "Mobile number": "01712345678",
  }))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole("button", { name: /Continue to payment|Review order/ })
    .click();
  const placement = page.waitForResponse(
    (r) => r.url() === `${base}/orders` && r.request().method() === "POST"
  );
  await page.getByRole("button", { name: /Place order|Confirm order/ }).click();
  expect((await placement).status()).toBe(201);
  await expect(
    page.getByText("Your order has been placed.", { exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue shopping", exact: true })
    .click();
  await page.getByRole("tab", { name: /Account/ }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true })
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      Object.values(localStorage).some((v) =>
        /accessToken|refreshToken/.test(v)
      )
    )
  ).toBe(false);
});
test("anonymous catalog uses the real API and private routes remain protected", async ({
  page,
  request,
}) => {
  const response = await request.get(`${base}/products?limit=1`);
  expect(response.ok()).toBe(true);
  const first = (await response.json()).data[0];
  expect(first.id).toMatch(/^[a-f0-9-]{36}$/);
  await page.goto(`/product/${first.slug}`, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByText(first.name, { exact: true }).first()
  ).toBeVisible();
  expect((await request.get(`${base}/me/orders`)).status()).toBe(401);
});
