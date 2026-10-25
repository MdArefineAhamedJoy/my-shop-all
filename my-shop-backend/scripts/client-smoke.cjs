const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({ quiet: true });
const {
  chromium,
} = require("../../my-shop-mobile/node_modules/@playwright/test");
const { totp } = require("../dist/modules/auth/crypto");
const web = process.env.SMOKE_WEB_URL || "http://localhost:3000";
const admin = process.env.SMOKE_ADMIN_URL || "http://localhost:3001";
const api = process.env.SMOKE_API_URL || "http://127.0.0.1:4000/v1";
for (const url of [web, admin, api])
  assert.ok(
    ["localhost", "127.0.0.1"].includes(new URL(url).hostname),
    "Client smoke is local only",
  );
async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const run = randomUUID().slice(0, 8),
    email = `browser-${run}@example.com`,
    password = `Browser-${randomUUID()}`;
  let orderId;
  try {
    await page.goto(`${web}/signup`, { waitUntil: "domcontentloaded" });
    for (const [name, value] of Object.entries({
      firstName: "Browser",
      lastName: "Customer",
      email,
      password,
    }))
      await page.locator(`input[name="${name}"]`).fill(value);
    const registration = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/auth/register") &&
        r.request().method() === "POST",
    );
    await page.locator('form button[type="submit"]').click();
    const registered = await registration;
    assert.equal(registered.status(), 201);
    const body = await registered.json();
    assert.equal("accessToken" in body.data, false);
    assert.equal("refreshToken" in body.data, false);
    await page.waitForURL("**/account");
    assert.ok(
      (await context.cookies()).some(
        (c) => c.name.endsWith("shop_session") && c.httpOnly,
      ),
    );
    assert.equal(
      await page.evaluate(() =>
        Object.values(localStorage).some((s) =>
          /refreshToken|accessToken/.test(s),
        ),
      ),
      false,
    );
    const hydratedProduct = page.waitForResponse(
      (r) => r.url().endsWith("/api/v1/cart") && r.status() === 200,
    );
    await page.goto(`${web}/product/classic-cotton-shirt`, {
      waitUntil: "domcontentloaded",
    });
    await hydratedProduct;
    await page
      .getByRole("button", { name: "Add to Cart", exact: true })
      .click();
    await page.waitForURL("**/cart");
    await page.goto(`${web}/checkout`, { waitUntil: "domcontentloaded" });
    for (const [name, value] of Object.entries({
      name: "Browser Customer",
      phone: "+8801700000000",
      line1: "House 12 Road 5",
      city: "Dhaka",
      region: "Dhaka",
      postalCode: "1207",
    }))
      await page.locator(`input[name="${name}"]`).fill(value);
    await page
      .getByRole("button", { name: "Review order", exact: true })
      .click();
    const placement = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/orders") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Confirm order", exact: true })
      .click();
    const placed = await placement;
    assert.equal(placed.status(), 201);
    orderId = (await placed.json()).data.id;
    await page.waitForURL("**/account?order=*");
    const csrf = await page.request.post(
      `${web}/api/v1/cart/items/${randomUUID()}`,
      { headers: { Origin: "https://evil.example" }, data: { quantity: 1 } },
    );
    assert.equal(csrf.status(), 403);
    const privateApi = await page.request.get(`${web}/api/v1/admin/orders`);
    assert.equal(privateApi.status(), 403);
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    adminPage.setDefaultTimeout(60000);
    await adminPage.goto(`${admin}/orders`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForURL("**/login");
    const enrollment = fs
      .readFileSync(path.resolve(".local-admin-setup.txt"), "utf8")
      .match(/otpauth:\/\/\S+/)?.[0];
    assert.ok(enrollment, "local admin MFA setup available");
    const secret = new URL(enrollment).searchParams.get("secret");
    for (const [name, value] of Object.entries({
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
      mfaCode: totp(secret),
    }))
      await adminPage.locator(`input[name="${name}"]`).fill(value);
    const login = adminPage.waitForResponse(
      (r) =>
        r.url().endsWith("/api/v1/auth/login") &&
        r.request().method() === "POST",
    );
    await adminPage
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    assert.equal((await login).status(), 201);
    await adminPage.waitForURL(admin + "/");
    assert.ok(
      (await adminContext.cookies()).some(
        (c) => c.name.endsWith("shop_admin_session") && c.httpOnly,
      ),
    );
    await adminPage.goto(`${admin}/orders?order=${orderId}`, {
      waitUntil: "domcontentloaded",
    });
    await adminPage
      .getByRole("button", { name: "Process", exact: true })
      .click();
    await adminPage
      .getByRole("button", { name: "Confirm action", exact: true })
      .click();
    await adminPage.getByRole("button", { name: "Ship", exact: true }).click();
    await adminPage.locator('input[name="courier"]').fill("Local test courier");
    await adminPage.locator('input[name="tracking"]').fill(`TEST-${run}`);
    await adminPage
      .getByRole("button", { name: "Confirm action", exact: true })
      .click();
    await adminPage
      .getByRole("button", { name: "Mark delivered", exact: true })
      .click();
    await adminPage
      .getByRole("button", { name: "Confirm action", exact: true })
      .click();
    await adminPage
      .getByRole("button", { name: "Record COD collection", exact: true })
      .click();
    const order = await (
      await adminPage.request.get(`${admin}/api/v1/admin/orders/${orderId}`)
    ).json();
    for (const [name, value] of Object.entries({
      amount: String(order.data.totalMinor / 100),
      reference: `browser-${run}`,
      evidence: "Confirmed by local browser integration test",
    }))
      await adminPage.locator(`input[name="${name}"]`).fill(value);
    await adminPage
      .getByRole("button", { name: "Confirm action", exact: true })
      .click();
    await adminPage.getByText("Payment: paid", { exact: false }).waitFor();
    const invoice = await page.request.get(
      `${web}/api/v1/orders/${orderId}/invoice`,
    );
    assert.equal(invoice.status(), 200);
    assert.match(invoice.headers()["content-type"], /application\/pdf/);
    const hydratedAccount = page.waitForResponse(
      (r) => r.url().includes("/api/v1/me/orders") && r.status() === 200,
    );
    await page.goto(`${web}/account`, { waitUntil: "domcontentloaded" });
    await hydratedAccount;
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.waitForURL(web + "/");
    assert.equal((await page.request.get(`${web}/api/v1/me`)).status(), 401);
    await adminContext.close();
    console.log(
      JSON.stringify({
        webRegistration: true,
        httpOnlySession: true,
        noBrowserTokens: true,
        realCartQuoteOrder: true,
        csrfRejected: true,
        customerAdminDenied: true,
        adminMfa: true,
        fulfillmentAndCod: true,
        ownedPdfInvoice: true,
        logoutRevoked: true,
      }),
    );
  } catch (e) {
    console.error("Client location:", new URL(page.url()).pathname);
    console.error(
      "Visible alerts:",
      await page
        .locator('[data-sonner-toast],[role="alert"]')
        .allTextContents(),
    );
    throw e;
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
