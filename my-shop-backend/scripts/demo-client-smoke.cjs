const assert = require("node:assert/strict");
const fs = require("node:fs");
require("dotenv").config({ quiet: true });
const {
  chromium,
} = require("../../my-shop-mobile/node_modules/@playwright/test");
const { totp } = require("../dist/modules/auth/crypto");
const { demoId } = require("../dist/database/demo/fixtures");
const web = "http://localhost:3000";
const admin = "http://localhost:3001";
const mobile = "http://localhost:8081";
const credentials = JSON.parse(
  fs.readFileSync(".local-demo-accounts.json", "utf8"),
);
const customer = credentials.accounts.find(
  (a) => a.email === "demo.ayan@example.com",
);

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const adminContext = await browser.newContext();
  const mobileContext = await browser.newContext();
  const read = async (request, base, path) => {
    const response = await request.get(`${base}/api/v1/${path}`);
    assert.equal(response.status(), 200, path);
    return (await response.json()).data;
  };
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    await page.goto(`${web}/shop`, { waitUntil: "domcontentloaded" });
    await page
      .getByText("Everyday Casual Sneakers", { exact: true })
      .first()
      .waitFor();
    await page.goto(`${web}/product/demo-premium-navy-cotton-shirt`, {
      waitUntil: "domcontentloaded",
    });
    const image = page.locator('img[src*="/v1/media/images/"]').first();
    await image.waitFor();
    await page.waitForFunction(() =>
      [...document.images].some(
        (i) =>
          i.src.includes("/v1/media/images/") &&
          i.complete &&
          i.naturalWidth > 0,
      ),
    );
    const login = await context.request.post(`${web}/api/v1/auth/login`, {
      headers: { Origin: web },
      data: { email: customer.email, password: customer.password },
    });
    assert.equal(login.status(), 201);
    const cart = await read(context.request, web, "cart");
    assert.equal(cart.items.length, 2);
    assert.equal((await read(context.request, web, "me/wishlist")).length, 3);
    assert.equal((await read(context.request, web, "me/addresses")).length, 2);
    assert.equal((await read(context.request, web, "me/orders")).length, 4);
    await page.goto(`${web}/account`, { waitUntil: "domcontentloaded" });
    await page
      .getByText(/DEMO-00001/)
      .first()
      .waitFor();
    console.log("Demo shop catalog, local images and customer account passed.");

    const enrollment = fs
      .readFileSync(".local-admin-setup.txt", "utf8")
      .match(/otpauth:\/\/\S+/)?.[0];
    assert.ok(
      enrollment,
      "Local admin enrollment required for this local smoke",
    );
    const mfaSecret = new URL(enrollment).searchParams.get("secret");
    const adminLogin = await adminContext.request.post(
      `${admin}/api/v1/auth/login`,
      {
        headers: { Origin: admin },
        data: {
          email: process.env.SEED_ADMIN_EMAIL,
          password: process.env.SEED_ADMIN_PASSWORD,
          mfaCode: totp(mfaSecret),
        },
      },
    );
    assert.equal(adminLogin.status(), 201);
    const overview = await read(
      adminContext.request,
      admin,
      "admin/reports/overview",
    );
    assert.ok(overview.ordersPlaced >= 40);
    assert.ok(Number(overview.refundedMinor) > 0);
    assert.equal(
      (await read(adminContext.request, admin, "admin/returns?limit=100"))
        .length,
      7,
    );
    assert.equal(
      (await read(adminContext.request, admin, "admin/promotions?limit=100"))
        .length,
      5,
    );
    assert.equal(
      (await read(adminContext.request, admin, "admin/collections")).length,
      6,
    );
    const adminPage = await adminContext.newPage();
    adminPage.setDefaultTimeout(60000);
    for (const [path, text] of [
      ["/", "Daily orders"],
      ["/products", "Everyday Casual Sneakers"],
      ["/categories", /Baby.*Active/],
      ["/orders", /DEMO-00001/],
      ["/invoices", /DEMO-/],
      ["/returns", /Demo size exchange requested/],
      ["/customers", /Demo/],
    ]) {
      await adminPage.goto(`${admin}${path}`, {
        waitUntil: "domcontentloaded",
      });
      await adminPage
        .getByText(text, { exact: typeof text === "string" })
        .first()
        .waitFor();
      console.log(`Demo admin page passed: ${path}`);
    }
    await adminPage.goto(`${admin}/storefront`, {
      waitUntil: "domcontentloaded",
    });
    await adminPage.waitForFunction(
      () =>
        document.querySelector('input[name="name"]')?.value === "MyShop Demo",
    );

    const mobilePage = await mobileContext.newPage();
    mobilePage.setDefaultTimeout(60000);
    await mobilePage.goto(mobile, { waitUntil: "domcontentloaded" });
    await mobilePage
      .getByRole("link", { name: "Shop Little Ones", exact: true })
      .waitFor();
    await mobilePage.goto(`${mobile}/login`, { waitUntil: "domcontentloaded" });
    await mobilePage
      .getByLabel("Email address", { exact: true })
      .fill(customer.email);
    await mobilePage
      .getByLabel("Password", { exact: true })
      .fill(customer.password);
    const signedIn = mobilePage.waitForResponse(
      (r) =>
        r.url().endsWith("/v1/auth/login") && r.request().method() === "POST",
    );
    await mobilePage
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    assert.equal((await signedIn).status(), 201);
    await mobilePage.getByRole("tab", { name: /Account/ }).click();
    await mobilePage.getByText("Hello, Ayan", { exact: true }).waitFor();
    await mobilePage.getByText("My orders", { exact: true }).click();
    await mobilePage.getByText(demoId("order:0"), { exact: true }).waitFor();
    console.log(
      JSON.stringify({
        webCatalogAndImages: true,
        customerCartWishlistAddressesOrders: true,
        adminPages: 8,
        overviewOrders: overview.ordersPlaced,
        demoReturns: 7,
        demoCoupons: 5,
        demoCollections: 6,
        mobileCollectionsAndCustomerHistory: true,
      }),
    );
  } finally {
    await context.request
      .post(`${web}/api/v1/auth/logout`, { headers: { Origin: web } })
      .catch(() => {});
    await adminContext.request
      .post(`${admin}/api/v1/auth/logout`, { headers: { Origin: admin } })
      .catch(() => {});
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
