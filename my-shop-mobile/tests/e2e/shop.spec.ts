import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}
async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/${name}.png` });
}
async function fillAddress(page: Page) {
  for (const [label, value] of Object.entries({
    "Email address": "demo@example.com",
    "First name": "Demo",
    "Last name": "User",
    "Street address": "House 1, Road 2",
    City: "Dhaka",
    "Postal code": "1207",
    "Mobile number": "01712345678",
  }))
    await page.getByLabel(label, { exact: true }).fill(value);
}
async function login(page: Page) {
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Preview123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("shopping: variants, wishlist, persistence, shipping validation and receipt", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page, "/");
  await expect(
    page.getByRole("link", { name: "Shop all", exact: true })
  ).toBeVisible();
  await screenshot(page, "home-mobile");
  await page.getByRole("link", { name: "Shop all", exact: true }).click();
  await page
    .getByRole("link", {
      name: "View Premium Cotton Shirt - Navy",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(page.getByText("Please select your size first.")).toBeVisible();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.getByRole("button", { name: "White", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page
    .getByRole("button", { name: "Add to wishlist", exact: true })
    .click();
  await screenshot(page, "product-mobile");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: "Remove from wishlist", exact: true })
  ).toBeVisible();
  await open(page, "/cart");
  await expect(page.getByText("Size M · Navy", { exact: true })).toBeVisible();
  await expect(page.getByText("Size M · White", { exact: true })).toBeVisible();
  await screenshot(page, "cart-mobile");
  await page
    .getByRole("button", { name: "Proceed to checkout", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Continue to payment", exact: true })
    .click();
  await expect(page.getByText("Enter your first name.")).toBeVisible();
  await fillAddress(page);
  await page
    .getByRole("button", { name: "Continue to payment", exact: true })
    .click();
  await page.getByRole("radio").filter({ hasText: "bKash" }).click();
  await screenshot(page, "checkout-mobile");
  await page
    .getByRole("button", { name: "Place preview order", exact: true })
    .click();
  await expect(
    page.getByText("Your preview order has been saved.")
  ).toBeVisible();
  await screenshot(page, "receipt-mobile");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByText("Your preview order has been saved.")
  ).toBeVisible();
  await open(page, "/cart");
  await expect(
    page.getByText("Your bag is empty", { exact: true })
  ).toBeVisible();
  await open(page, "/wishlist");
  await expect(
    page.getByRole("link", {
      name: "View Premium Cotton Shirt - Navy",
      exact: true,
    })
  ).toBeVisible();
  await open(page, "/orders");
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await login(page);
  await expect(page.getByText("Your recent favorites.")).toBeVisible();
  await expect(
    page.getByRole("link").filter({ hasText: "PREVIEW-" })
  ).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("auth: registration, profile, address book, remember me and sign out", async ({
  page,
}) => {
  await open(page, "/login");
  await expect(page.getByText("Welcome back.")).toBeVisible();
  await screenshot(page, "login-mobile");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Enter your email address.")).toBeVisible();
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Full name", { exact: true }).fill("Demo User");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Preview123");
  await page.getByLabel("Confirm password", { exact: true }).fill("different");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await page.getByLabel("Confirm password", { exact: true }).fill("Preview123");
  await page.getByRole("checkbox").click();
  await screenshot(page, "register-mobile");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByText("Hello, Demo", { exact: true })).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Hello, Demo", { exact: true })).toBeVisible();
  await screenshot(page, "account-mobile");
  await page.getByRole("button", { name: /Personal information/ }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Demo Customer");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByText("Your preview profile has been updated.")
  ).toBeVisible();
  await open(page, "/addresses");
  await page
    .getByRole("button", { name: "Add a new address", exact: true })
    .click();
  await fillAddress(page);
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(
    page.getByText("House 1, Road 2", { exact: false })
  ).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByText("House 1, Road 2", { exact: false })
  ).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  expect(stored).not.toContain("Preview123");
  expect(stored).not.toContain('"token"');
  await open(page, "/account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .last()
    .click();
  await expect(page.getByText("Make yourself at home.")).toBeVisible();
  await open(page, "/profile");
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("recovery: invalid OTP, verified reset and no persistent password", async ({
  page,
}) => {
  await open(page, "/create-newpassword");
  await expect(page.getByText("Forgot your password?")).toBeVisible();
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Check your code.")).toBeVisible();
  await page.getByLabel("Verification code", { exact: true }).fill("999999");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(
    page.getByText("That code is incorrect. Please try again.")
  ).toBeVisible();
  await screenshot(page, "verification-mobile");
  await page.getByLabel("Verification code", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(page.getByText("A fresh start.")).toBeVisible();
  await page.getByLabel("New password", { exact: true }).fill("NewPreview123");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("NewPreview123");
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page.getByText("You're all set.")).toBeVisible();
  await page
    .getByRole("button", { name: "Back to sign in", exact: true })
    .click();
  await expect(page.getByText("Welcome back.")).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "NewPreview123"
  );
});

test("catalog filtering and responsive screens", async ({ page }) => {
  await open(page, "/shop");
  await page
    .getByLabel("Find your next favorite", { exact: true })
    .fill("not-a-real-product");
  await expect(
    page.getByText("No pieces found", { exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open filters and sort", exact: true })
    .click();
  await page.getByLabel("Minimum price (৳)", { exact: true }).fill("900");
  await page.getByLabel("Maximum price (৳)", { exact: true }).fill("1000");
  await page
    .getByRole("button", { name: "Price: low to high", exact: true })
    .click();
  await page.getByRole("button", { name: "Show results", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "View V-Neck T-Shirt - Grey", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "View Premium Cotton Shirt - Navy",
      exact: true,
    })
  ).toHaveCount(0);
  await screenshot(page, "shop-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, "/");
  await expect(
    page.getByRole("link", { name: "Shop all", exact: true })
  ).toBeVisible();
  await screenshot(page, "home-desktop");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await open(page, "/login");
  await expect(page.getByText("Welcome back.")).toBeVisible();
  await screenshot(page, "login-desktop");
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});
