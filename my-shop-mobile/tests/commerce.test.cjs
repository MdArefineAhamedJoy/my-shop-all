const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
require.extensions[".ts"] = (mod, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  mod._compile(code, filename);
};
function load(relative) {
  const filename = path.resolve(__dirname, "..", relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod._compile(compiled, filename);
  return mod.exports;
}
const {
  initialState,
  reducer,
  totals,
  cartKey,
  filterProducts,
  validateAddress,
} = { ...load("src/store/shopReducer.ts"), ...load("src/utils/commerce.ts") };
const { MOCK_PRODUCTS: products } = load("src/data/products.ts");
const product = products[0];
const { loginSchema, registerSchema, resetPasswordSchema } = load(
  "src/feature/(auth)/schemas/authSchemas.ts"
);
const { authService, PREVIEW_OTP } = load("src/services/authService.ts");
const { resolveAuthDestination } = load("src/utils/navigation.ts");
const add = (state, overrides = {}) =>
  reducer(state, {
    type: "add",
    product,
    size: "M",
    color: "Navy",
    quantity: 1,
    ...overrides,
  });

test("same size and color merge; different colors and sizes stay separate", () => {
  let state = add(add(initialState));
  state = add(state, { color: "White" });
  state = add(state, { size: "L" });
  assert.equal(state.cart.length, 3);
  assert.equal(state.cart[0].quantity, 2);
  assert.notEqual(cartKey(state.cart[0]), cartKey(state.cart[1]));
});
test("stock limit applies across every variant of a product", () => {
  const limited = { ...product, stock: 3 };
  let state = add(initialState, { product: limited, quantity: 2 });
  state = add(state, { product: limited, color: "White", quantity: 5 });
  assert.deepEqual(
    state.cart.map((i) => i.quantity),
    [2, 1]
  );
  state = add(state, { product: limited, size: "L" });
  assert.equal(state.cart.length, 2);
  const next = reducer(state, {
    type: "quantity",
    key: cartKey(state.cart[0]),
    quantity: 50,
  });
  assert.equal(next.cart[0].quantity, 2);
});
test("invalid size, invalid color and out of stock products cannot enter the bag", () => {
  assert.equal(add(initialState, { size: "INVALID" }).cart.length, 0);
  assert.equal(add(initialState, { color: "INVALID" }).cart.length, 0);
  assert.equal(
    add(initialState, { product: { ...product, stock: 0 } }).cart.length,
    0
  );
});
test("quantities stay positive and removing one variant keeps the other", () => {
  const state = add(add(initialState), { color: "White" });
  const key = cartKey(state.cart[0]);
  const updated = reducer(state, { type: "quantity", key, quantity: -1 });
  assert.equal(updated.cart[0].quantity, 1);
  const removed = reducer(updated, { type: "remove", key });
  assert.equal(removed.cart.length, 1);
  assert.equal(removed.cart[0].color, "White");
});
test("checkout calculates the same 10% estimated tax as the web shop", () => {
  assert.deepEqual(totals(add(initialState, { quantity: 2 }).cart), {
    subtotal: 3798,
    tax: 379.8,
    total: 4177.8,
  });
  assert.deepEqual(totals([]), { subtotal: 0, tax: 0, total: 0 });
});
test("wishlist toggle never duplicates a favorite", () => {
  const state = reducer(initialState, { type: "wishlist", id: "1" });
  assert.deepEqual(state.wishlist, ["1"]);
  assert.deepEqual(reducer(state, { type: "wishlist", id: "1" }).wishlist, []);
});
test("gender includes unisex and combines with category and query", () => {
  const filtered = filterProducts(products, {
    gender: "women",
    category: "pants",
    query: "pants",
  });
  assert.ok(filtered.length > 0);
  assert.ok(
    filtered.every(
      (p) => ["women", "unisex"].includes(p.gender) && p.category === "pants"
    )
  );
});
test("sale filter requires an actual price reduction and respects price and size filters", () => {
  const filtered = filterProducts(products, {
    tag: "sale",
    min: "1500",
    max: "2300",
    size: "M",
  });
  assert.ok(filtered.length > 0);
  assert.ok(
    filtered.every(
      (p) =>
        p.originalPrice > p.price &&
        p.price >= 1500 &&
        p.price <= 2300 &&
        p.sizes.includes("M")
    )
  );
});
test("sorting does not mutate the catalog and empty searches return no matches", () => {
  const ids = products.map((p) => p.id);
  const sorted = filterProducts(products, { sort: "price-low" });
  assert.ok(sorted.every((p, i) => i === 0 || sorted[i - 1].price <= p.price));
  assert.deepEqual(
    products.map((p) => p.id),
    ids
  );
  assert.deepEqual(
    filterProducts(products, { query: "not-a-real-product" }),
    []
  );
});
test("address validation rejects missing fields, email, phone and postal code errors", () => {
  const address = {
    firstName: "Demo",
    lastName: "User",
    email: "demo@example.com",
    phone: "+8801712345678",
    address: "House 1, Road 2",
    city: "Dhaka",
    postalCode: "1207",
  };
  assert.equal(validateAddress(address), null);
  for (const [key, value] of [
    ["firstName", " "],
    ["email", "wrong"],
    ["phone", "1234"],
    ["postalCode", "abc"],
  ])
    assert.ok(validateAddress({ ...address, [key]: value }));
});
test("placing an order clears the cart, preserves favorites and cannot duplicate on an empty cart", () => {
  const state = { ...add(initialState), wishlist: ["1"] };
  const order = {
    id: "DEMO-1",
    items: state.cart,
    total: totals(state.cart).total,
  };
  const placed = reducer(state, { type: "order", order });
  assert.equal(placed.cart.length, 0);
  assert.equal(placed.orders[0].id, "DEMO-1");
  assert.deepEqual(placed.wishlist, ["1"]);
  assert.equal(reducer(placed, { type: "order", order }).orders.length, 1);
});

test("auth forms validate email, password, terms and password confirmation", () => {
  assert.equal(
    loginSchema.safeParse({ email: "invalid", password: "123" }).success,
    false
  );
  assert.equal(
    loginSchema.safeParse({ email: "demo@example.com", password: "Preview123" })
      .success,
    true
  );
  const values = {
    name: "Demo User",
    email: "demo@example.com",
    password: "Preview123",
    confirmPassword: "Preview123",
    acceptedTerms: true,
  };
  assert.equal(registerSchema.safeParse(values).success, true);
  assert.equal(
    registerSchema.safeParse({ ...values, acceptedTerms: false }).success,
    false
  );
  assert.equal(
    registerSchema.safeParse({ ...values, confirmPassword: "different" })
      .success,
    false
  );
  assert.equal(
    resetPasswordSchema.safeParse({
      password: "Preview123",
      confirmPassword: "different",
    }).success,
    false
  );
});

test("preview auth never returns a password or a fake access token", async () => {
  const session = await authService.register({
    name: "Demo User",
    email: " DEMO@example.com ",
    password: "Preview123",
    confirmPassword: "Preview123",
  });
  assert.equal(session.mode, "preview");
  assert.equal(session.user.email, "demo@example.com");
  assert.equal(JSON.stringify(session).includes("Preview123"), false);
  assert.equal("token" in session, false);
});

test("password reset preview requires a matching unexpired code", async () => {
  const challenge = await authService.requestReset("demo@example.com");
  await assert.rejects(
    authService.verifyCode(challenge, "999999"),
    /incorrect/
  );
  await assert.rejects(
    authService.verifyCode({ ...challenge, expiresAt: 0 }, PREVIEW_OTP),
    /expired/
  );
  await assert.rejects(
    authService.resetPassword(challenge, "Preview123"),
    /Verify/
  );
  const verified = await authService.verifyCode(challenge, PREVIEW_OTP);
  assert.equal(verified.verified, true);
  await authService.resetPassword(verified, "Preview123");
});

test("sign-in return destinations only allow known in-app screens", () => {
  assert.equal(resolveAuthDestination("/profile"), "/profile");
  assert.equal(resolveAuthDestination("https://example.com"), "/account");
  assert.equal(resolveAuthDestination("//example.com"), "/account");
  assert.equal(resolveAuthDestination(undefined), "/account");
});
