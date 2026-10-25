import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { DataSource } from "typeorm";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { AppModule } from "../src/app.module";
import { setupApp } from "../src/setup";
import { AuthService } from "../src/modules/auth/auth.service";
import { Role, User } from "../src/modules/users/entities/user.entity";
import {
  Category,
  Product,
  Variant,
} from "../src/modules/catalog/entities/catalog.entity";
import { Inventory } from "../src/modules/inventory/entities/inventory.entity";
import { Quote } from "../src/modules/checkout/entities/quote.entity";
import { Order } from "../src/modules/orders/entities/order.entity";
import {
  OutboxEvent,
  RateLimit,
} from "../src/modules/platform/entities/platform.entity";
import {
  encrypt,
  decrypt,
  hashPassword,
  newTotpSecret,
  totp,
} from "../src/modules/auth/crypto";
import { Address } from "../src/modules/users/entities/address.entity";
import { OutboxWorker } from "../src/modules/platform/outbox.worker";
import { SslcommerzClient } from "../src/modules/payments/sslcommerz.client";
import {
  GatewayAttempt,
  GatewayRefund,
} from "../src/modules/payments/entities/gateway.entity";
import {
  Payment,
  Refund,
} from "../src/modules/payments/entities/payment.entity";

describe("MyShop API with real PostgreSQL", () => {
  let app: INestApplication;
  let db: DataSource;
  let auth: AuthService;
  let admin: string;
  let customer: string;
  let other: string;
  let staff: string;
  let customerId: string;
  let product: Product;
  let variant: Variant;
  let category: Category;
  let order: any;
  let quote: any;
  let returnId: string;
  let returnVersion: number;
  const run = randomUUID().slice(0, 8);
  const password = "A-strong-test-password-123!";
  const address = {
    name: "Test Customer",
    phone: "+8801700000000",
    line1: "12 Sample Road",
    city: "Dhaka",
    region: "Dhaka",
    postalCode: "1207",
    countryCode: "BD",
  };
  const key = () => randomUUID();
  const get = (path: string, token = customer) =>
    request(app.getHttpServer())
      .get(`/v1/${path}`)
      .set("Authorization", `Bearer ${token}`);
  const post = (
    path: string,
    body: object,
    token = customer,
    idempotency = key(),
  ) =>
    request(app.getHttpServer())
      .post(`/v1/${path}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotency)
      .send(body);
  const put = (path: string, body: object, token = customer) =>
    request(app.getHttpServer())
      .put(`/v1/${path}`)
      .set("Authorization", `Bearer ${token}`)
      .send(body);

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ bodyParser: false });
    setupApp(app);
    db = app.get(DataSource);
    await db.runMigrations();
    await app.init();
    auth = app.get(AuthService);
    await db.getRepository(RateLimit).clear();
    const hash = await hashPassword(password);
    const mfaSecret = newTotpSecret();
    await db.getRepository(User).save({
      email: `admin-${run}@example.com`,
      name: "Administrator",
      role: Role.ADMIN,
      passwordHash: hash,
      mfaSecret: encrypt(mfaSecret, process.env.APP_ENCRYPTION_KEY!),
    });
    const adminLogin = await post(
      "auth/login",
      { email: `admin-${run}@example.com`, password, mfaCode: totp(mfaSecret) },
      "",
    );
    expect(adminLogin.status).toBe(201);
    admin = adminLogin.body.data.accessToken;
    const a = await auth.register(
      { email: `customer-${run}@example.com`, name: "Customer", password },
      "test",
    );
    customer = a.accessToken;
    customerId = a.user.id;
    const b = await auth.register(
      { email: `other-${run}@example.com`, name: "Other", password },
      "test",
    );
    other = b.accessToken;
    const staffSecret = newTotpSecret();
    await db.getRepository(User).save({
      email: `staff-${run}@example.com`,
      name: "Limited staff",
      role: Role.STAFF,
      permissions: ["catalog:read"],
      passwordHash: hash,
      mfaSecret: encrypt(staffSecret, process.env.APP_ENCRYPTION_KEY!),
    });
    staff = (
      await auth.login(
        {
          email: `staff-${run}@example.com`,
          password,
          mfaCode: totp(staffSecret),
        },
        "test",
      )
    ).accessToken;
    category = await db
      .getRepository(Category)
      .save({ name: "Test shirts", slug: `shirts-${run}` });
    product = await db.getRepository(Product).save({
      name: "Cotton test shirt",
      slug: `cotton-shirt-${run}`,
      description: "A cotton shirt used in integration tests.",
      categoryId: category.id,
      gender: "unisex",
      status: "published",
      publishedAt: new Date(),
      images: ["https://example.com/shirt.webp"],
      tags: ["cotton"],
    });
    variant = await db.getRepository(Variant).save({
      productId: product.id,
      sku: `TEST-${run}`,
      size: "M",
      color: "navy",
      priceMinor: 129900,
    });
    await db
      .getRepository(Inventory)
      .save({ variantId: variant.id, available: 100 });
  }, 120000);
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(async () => {
    await db.getRepository(RateLimit).clear();
  });

  it("exposes Swagger UI and OpenAPI schemas", async () => {
    await request(app.getHttpServer()).get("/docs/").expect(200);
    const res = await request(app.getHttpServer())
      .get("/docs-json")
      .expect(200);
    expect(res.body.paths["/v1/orders"].post.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Idempotency-Key" }),
      ]),
    );
    expect(res.body.components.securitySchemes.bearer).toBeDefined();
    expect(
      res.body.components.schemas.CodCollectionDto.properties.amountMinor,
    ).toBeDefined();
    expect(
      res.body.components.schemas.CollectionDto.properties.productIds,
    ).toBeDefined();
    expect(res.body.paths["/v1/auth/register"].post.security).toEqual([]);
    expect(res.body.paths["/v1/orders"].post.security).toEqual([
      { bearer: [] },
    ]);
  });
  it("serves health checks", async () => {
    expect((await get("health/live", "")).body.data.status).toBe("ok");
    await get("health/ready", "").expect(200);
  });
  it("allows public catalog reads but protects personal/admin data", async () => {
    await get("products", "").expect(200);
    await get(`products/${product.slug}`, "").expect(200);
    await get("me", "").expect(401);
    await get("admin/products", "").expect(401);
    await get("admin/products", customer).expect(403);
  });
  it("rejects role escalation at registration and profile update", async () => {
    await post(
      "auth/register",
      { email: `bad-${run}@example.com`, name: "Bad", password, role: "admin" },
      "",
    ).expect(400);
    await request(app.getHttpServer())
      .patch("/v1/me")
      .set("Authorization", `Bearer ${customer}`)
      .send({ expectedVersion: 1, role: "admin" })
      .expect(400);
  });
  it("requires staff MFA and enforces fine-grained permissions", async () => {
    await post(
      "auth/login",
      { email: `admin-${run}@example.com`, password },
      "",
    ).expect(401);
    await get("admin/products", staff).expect(200);
    await post(
      "admin/categories",
      { name: "Forbidden", slug: "forbidden" },
      staff,
    ).expect(403);
    await get("admin/staff", staff).expect(403);
  });
  it("normalizes emails, rotates refresh tokens, and rejects replay", async () => {
    const email = `rotate-${run}@example.com`;
    const login = await post(
      "auth/register",
      { email: email.toUpperCase(), name: "Rotating User", password },
      "",
    ).expect(201);
    expect(login.body.data.user.email).toBe(email);
    const old = login.body.data.refreshToken;
    const refresh = await post(
      "auth/refresh",
      { refreshToken: old },
      "",
    ).expect(201);
    expect(refresh.body.data.refreshToken).not.toBe(old);
    await post("auth/refresh", { refreshToken: old }, "").expect(401);
    await post("auth/logout", {}, refresh.body.data.accessToken).expect(201);
    await get("me", refresh.body.data.accessToken).expect(401);
    await post(
      "auth/refresh",
      { refreshToken: refresh.body.data.refreshToken },
      "",
    ).expect(401);
  });
  it("keeps password and MFA hashes out of responses", async () => {
    const res = await get("me");
    expect(JSON.stringify(res.body)).not.toMatch(
      /passwordHash|mfaSecret|refreshDigest/,
    );
    expect((await get("auth/sessions")).body.data.length).toBeGreaterThan(0);
  });
  it("does not disclose account existence during recovery", async () => {
    const a = await post(
      "auth/password-reset/request",
      { email: `absent-${run}@example.com` },
      "",
    ).expect(201);
    const b = await post(
      "auth/password-reset/request",
      { email: `customer-${run}@example.com` },
      "",
    ).expect(201);
    expect(a.body.data).toEqual(b.body.data);
    expect(a.body.data.token).toBeUndefined();
  });
  it("hides drafts and uses full-text catalog filtering", async () => {
    const draft = await db.getRepository(Product).save({
      name: "Draft",
      slug: `draft-${run}`,
      description: "A draft product",
      categoryId: category.id,
      gender: "unisex",
    });
    await get(`products/${draft.slug}`, "").expect(404);
    const res = await get(
      `products?q=cotton&categoryId=${category.id}`,
      "",
    ).expect(200);
    expect(res.body.data.map((p: any) => p.id)).toContain(product.id);
  });
  it("rejects invalid cursors, SQL injection filters and unbounded limits", async () => {
    await get("products?cursor=garbage", "").expect(400);
    await get("products?limit=10000", "").expect(400);
    await get(
      `products?q=${encodeURIComponent("'; DROP TABLE users; --")}`,
      "",
    ).expect(200);
    expect(await db.getRepository(User).count()).toBeGreaterThan(0);
  });
  it("enforces address ownership and a single default address", async () => {
    const a = await post("me/addresses", {
      label: "Home",
      details: address,
      isDefault: true,
    }).expect(201);
    await post("me/addresses", {
      label: "Office",
      details: address,
      isDefault: true,
    }).expect(201);
    expect(
      await db
        .getRepository(Address)
        .countBy({ userId: customerId, isDefault: true }),
    ).toBe(1);
    await request(app.getHttpServer())
      .delete(`/v1/me/addresses/${a.body.data.id}`)
      .set("Authorization", `Bearer ${other}`)
      .expect(404);
  });
  it("supports idempotent wishlist add/removal", async () => {
    await put(`me/wishlist/${product.id}`, {}).expect(200);
    await put(`me/wishlist/${product.id}`, {}).expect(200);
    expect(
      (await get("me/wishlist")).body.data.filter(
        (w: any) => w.productId === product.id,
      ),
    ).toHaveLength(1);
  });
  it("accepts absolute quantities, rejects client prices, and computes totals", async () => {
    await put(`cart/items/${variant.id}`, {
      quantity: 2,
      priceMinor: 1,
    }).expect(400);
    await put(`cart/items/${variant.id}`, { quantity: 2 }).expect(200);
    await put(`cart/items/${variant.id}`, { quantity: 2 }).expect(200);
    expect((await get("cart")).body.data.subtotalMinor).toBe(259800);
    const res = await post("checkout/quotes", {
      shippingAddress: address,
      paymentMethod: "cod",
    }).expect(201);
    quote = res.body.data;
    expect(quote.totals.totalMinor).toBe(267800);
    await post("checkout/quotes", {
      shippingAddress: address,
      paymentMethod: "bkash",
    }).expect(400);
  });
  it("requires idempotency and quote ownership", async () => {
    await request(app.getHttpServer())
      .post("/v1/orders")
      .set("Authorization", `Bearer ${customer}`)
      .send({ quoteId: quote.id })
      .expect(400);
    await post("orders", { quoteId: quote.id }, other).expect(404);
  });
  it("places once under concurrent retries and deducts stock exactly once", async () => {
    const idem = key();
    const responses = await Promise.all([
      post("orders", { quoteId: quote.id }, customer, idem),
      post("orders", { quoteId: quote.id }, customer, idem),
    ]);
    expect(responses.map((r) => r.status)).toEqual([201, 201]);
    expect(responses[0].body.data.id).toBe(responses[1].body.data.id);
    order = responses[0].body.data;
    expect(
      (
        await db
          .getRepository(Inventory)
          .findOneByOrFail({ variantId: variant.id })
      ).available,
    ).toBe(98);
    expect(await db.getRepository(Order).countBy({ quoteId: quote.id })).toBe(
      1,
    );
    await post("orders", { quoteId: randomUUID() }, customer, idem).expect(409);
    expect((await get("cart")).body.data.items).toHaveLength(0);
  });
  it("rejects ownership bypass on orders and invoices", async () => {
    await get(`orders/${order.id}`, other).expect(404);
    await get(`orders/${order.id}/invoice`, other).expect(404);
    await get(`orders/${order.id}/invoice`)
      .expect("Content-Type", /application\/pdf/)
      .expect(200);
  });
  it("enforces order transition/version rules and keeps delivery separate from payment", async () => {
    await post(
      `admin/orders/${order.id}/ship`,
      {
        expectedVersion: order.version,
        courier: "Test Courier",
        trackingNumber: "TRACK-123",
      },
      admin,
    ).expect(409);
    order = (
      await post(
        `admin/orders/${order.id}/process`,
        { expectedVersion: order.version },
        admin,
      ).expect(201)
    ).body.data;
    await post(
      `admin/orders/${order.id}/ship`,
      {
        expectedVersion: 1,
        courier: "Test Courier",
        trackingNumber: "TRACK-123",
      },
      admin,
    ).expect(409);
    order = (
      await post(
        `admin/orders/${order.id}/ship`,
        {
          expectedVersion: order.version,
          courier: "Test Courier",
          trackingNumber: "TRACK-123",
        },
        admin,
      ).expect(201)
    ).body.data;
    order = (
      await post(
        `admin/orders/${order.id}/deliver`,
        { expectedVersion: order.version },
        admin,
      ).expect(201)
    ).body.data;
    expect(order.paymentStatus).toBe("unpaid");
    await post(`orders/${order.id}/cancel`, {
      expectedVersion: order.version,
      reason: "Too late to cancel",
    }).expect(409);
  });
  it("records COD only within the outstanding balance", async () => {
    const body = {
      expectedVersion: order.version,
      amountMinor: order.totalMinor + 1,
      reference: `COLLECT-${run}`,
      evidence: "Courier settlement confirmation",
      collectedAt: new Date().toISOString(),
    };
    await post(`admin/orders/${order.id}/cod-collections`, body, admin).expect(
      409,
    );
    const res = await post(
      `admin/orders/${order.id}/cod-collections`,
      { ...body, amountMinor: order.totalMinor },
      admin,
    ).expect(201);
    order.version = res.body.data.orderVersion;
    expect(res.body.data.paymentStatus).toBe("paid");
  });
  it("enforces return ownership and purchased quantities", async () => {
    const detail = await get(`orders/${order.id}`).expect(200);
    const line = detail.body.data.lines[0];
    await post(
      `orders/${order.id}/returns`,
      {
        lines: [{ orderLineId: line.id, quantity: 1 }],
        reason: "Wrong size received",
      },
      other,
    ).expect(404);
    await post(`orders/${order.id}/returns`, {
      lines: [{ orderLineId: line.id, quantity: 3 }],
      reason: "Wrong size received",
    }).expect(409);
    const res = await post(`orders/${order.id}/returns`, {
      lines: [{ orderLineId: line.id, quantity: 1 }],
      reason: "Wrong size received",
    }).expect(201);
    returnId = res.body.data.id;
    returnVersion = res.body.data.version;
    await get(`returns/${returnId}`, other).expect(404);
  });
  it("restocks an inspected return exactly once and requires refund before closing", async () => {
    for (const action of ["approve", "receive"])
      returnVersion = (
        await post(
          `admin/returns/${returnId}/${action}`,
          { expectedVersion: returnVersion, note: "Checked by support team" },
          admin,
        ).expect(201)
      ).body.data.version;
    const row = (await get(`admin/returns/${returnId}`, admin)).body.data;
    const body = {
      expectedVersion: returnVersion,
      note: "Item is in sellable condition",
      lines: [{ orderLineId: row.lines[0].orderLineId, restockQuantity: 1 }],
    };
    const idem = key();
    const res = await post(
      `admin/returns/${returnId}/inspect`,
      body,
      admin,
      idem,
    ).expect(201);
    returnVersion = res.body.data.version;
    await post(`admin/returns/${returnId}/inspect`, body, admin, idem).expect(
      201,
    );
    expect(
      (
        await db
          .getRepository(Inventory)
          .findOneByOrFail({ variantId: variant.id })
      ).available,
    ).toBe(99);
    await post(
      `admin/returns/${returnId}/close`,
      { expectedVersion: returnVersion, note: "Close after refund" },
      admin,
    ).expect(409);
  });
  it("reauthenticates refunds, caps them at collected funds, and closes the return", async () => {
    const body = {
      expectedVersion: order.version,
      amountMinor: 129900,
      reference: `REFUND-${run}`,
      reason: "Return accepted and cash refunded",
      currentPassword: "wrong",
    };
    await post(`admin/orders/${order.id}/refunds`, body, admin).expect(401);
    await post(
      `admin/orders/${order.id}/refunds`,
      { ...body, currentPassword: password, amountMinor: order.totalMinor + 1 },
      admin,
    ).expect(409);
    const res = await post(
      `admin/orders/${order.id}/refunds`,
      { ...body, currentPassword: password },
      admin,
    ).expect(201);
    order.version = res.body.data.orderVersion;
    expect(res.body.data.paymentStatus).toBe("partially_refunded");
    await post(
      `admin/returns/${returnId}/close`,
      {
        expectedVersion: returnVersion,
        note: "Refund confirmed and case closed",
      },
      admin,
    ).expect(201);
  });
  it("reports real collections and redacted audit data", async () => {
    const res = await get("admin/reports/overview", admin).expect(200);
    expect(Number(res.body.data.collectedMinor)).toBeGreaterThanOrEqual(
      order.totalMinor,
    );
    const audit = await get("admin/audit-logs", admin).expect(200);
    expect(JSON.stringify(audit.body)).not.toContain(password);
    await get(
      "admin/reports/overview?from=2020-01-01T00:00:00Z&to=2026-01-01T00:00:00Z",
      admin,
    ).expect(400);
  });
  it("serializes competing checkouts for the final stock unit without overselling", async () => {
    const scarce = await db.getRepository(Variant).save({
      productId: product.id,
      sku: `SCARCE-${run}`,
      size: "XL",
      color: "navy",
      priceMinor: 50000,
    });
    await db
      .getRepository(Inventory)
      .save({ variantId: scarce.id, available: 1 });
    const buyers = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        auth.register(
          {
            email: `buyer-${run}-${i}@example.com`,
            name: "Concurrent buyer",
            password,
          },
          "test",
        ),
      ),
    );
    await Promise.all(
      buyers.map((b) =>
        put(`cart/items/${scarce.id}`, { quantity: 1 }, b.accessToken).expect(
          200,
        ),
      ),
    );
    const quotes = await Promise.all(
      buyers.map((b) =>
        post(
          "checkout/quotes",
          { shippingAddress: address, paymentMethod: "cod" },
          b.accessToken,
        ).expect(201),
      ),
    );
    const responses = await Promise.all(
      buyers.map((b, i) =>
        post("orders", { quoteId: quotes[i].body.data.id }, b.accessToken),
      ),
    );
    expect(responses.filter((r) => r.status === 201)).toHaveLength(1);
    expect(responses.filter((r) => r.status === 409)).toHaveLength(7);
    expect(
      (
        await db
          .getRepository(Inventory)
          .findOneByOrFail({ variantId: scarce.id })
      ).available,
    ).toBe(0);
    expect(
      await db.getRepository(Order).countBy({
        quoteId:
          quotes[responses.findIndex((r) => r.status === 201)].body.data.id,
      }),
    ).toBe(1);
  });
  it("rejects changed/expired quotes and restores cancelled stock only once", async () => {
    await put(`cart/items/${variant.id}`, { quantity: 1 }).expect(200);
    const old = (
      await post("checkout/quotes", {
        shippingAddress: address,
        paymentMethod: "cod",
      }).expect(201)
    ).body.data;
    await put(`cart/items/${variant.id}`, { quantity: 2 }).expect(200);
    await post("orders", { quoteId: old.id }).expect(409);
    const expired = (
      await post("checkout/quotes", {
        shippingAddress: address,
        paymentMethod: "cod",
      }).expect(201)
    ).body.data;
    await db
      .getRepository(Quote)
      .update(expired.id, { expiresAt: new Date(Date.now() - 1000) });
    await post("orders", { quoteId: expired.id }).expect(409);
    const good = (
      await post("checkout/quotes", {
        shippingAddress: address,
        paymentMethod: "cod",
      }).expect(201)
    ).body.data;
    const placed = (await post("orders", { quoteId: good.id }).expect(201)).body
      .data;
    const before = (
      await db
        .getRepository(Inventory)
        .findOneByOrFail({ variantId: variant.id })
    ).available;
    const idem = key();
    const cancel = {
      expectedVersion: placed.version,
      reason: "Customer changed their mind",
    };
    await post(`orders/${placed.id}/cancel`, cancel, customer, idem).expect(
      201,
    );
    await post(`orders/${placed.id}/cancel`, cancel, customer, idem).expect(
      201,
    );
    expect(
      (
        await db
          .getRepository(Inventory)
          .findOneByOrFail({ variantId: variant.id })
      ).available,
    ).toBe(before + 2);
  });
  it("validates image content and protects uploads", async () => {
    await request(app.getHttpServer())
      .post("/v1/media/images")
      .attach("file", Buffer.from("invalid"), {
        filename: "fake.png",
        contentType: "image/png",
      })
      .expect(401);
    await request(app.getHttpServer())
      .post("/v1/media/images")
      .set("Authorization", `Bearer ${admin}`)
      .attach("file", Buffer.from("invalid"), {
        filename: "fake.png",
        contentType: "image/png",
      })
      .expect(400);
  });
  it("serves uploaded images to the storefront on another origin", async () => {
    const image = await sharp({
      create: { width: 2, height: 2, channels: 3, background: "#102030" },
    })
      .png()
      .toBuffer();
    const uploaded = await request(app.getHttpServer())
      .post("/v1/media/images")
      .set("Authorization", `Bearer ${admin}`)
      .attach("file", image, {
        filename: "valid.png",
        contentType: "image/png",
      })
      .expect(201);
    await request(app.getHttpServer())
      .get(`/v1/media/images/${uploaded.body.data.filename}`)
      .set("Origin", "http://localhost:3000")
      .expect(200)
      .expect("Content-Type", "image/webp")
      .expect("Cross-Origin-Resource-Policy", "cross-origin");
    await get("me").expect("Cross-Origin-Resource-Policy", "same-origin");
  });
  it("creates, publishes, updates and archives catalog products with stock auditing", async () => {
    const res = await post(
      "admin/products",
      {
        name: "Managed product",
        slug: `managed-${run}`,
        description: "Created through the protected catalog API.",
        categoryId: category.id,
        gender: "unisex",
        images: ["https://example.com/managed.webp"],
        variants: [
          {
            sku: `MANAGED-${run}`,
            size: "S",
            color: "white",
            priceMinor: 45000,
          },
        ],
      },
      admin,
    ).expect(201);
    let managed = res.body.data;
    await get(`products/${managed.slug}`, "").expect(404);
    managed = (
      await post(
        `admin/products/${managed.id}/publish`,
        { expectedVersion: managed.version },
        admin,
      ).expect(201)
    ).body.data;
    const details = (await get(`admin/products/${managed.id}`, admin)).body
      .data;
    const v = details.variants[0];
    const stock = await db
      .getRepository(Inventory)
      .findOneByOrFail({ variantId: v.id });
    const adjustment = {
      expectedVersion: stock.version,
      variantId: v.id,
      quantity: 5,
      reason: "Warehouse stock receipt",
    };
    const idem = key();
    await post("admin/inventory/adjustments", adjustment, admin, idem).expect(
      201,
    );
    await post("admin/inventory/adjustments", adjustment, admin, idem).expect(
      201,
    );
    expect(
      (await db.getRepository(Inventory).findOneByOrFail({ id: stock.id }))
        .available,
    ).toBe(5);
    await post(
      "admin/inventory/adjustments",
      { ...adjustment, quantity: -100 },
      admin,
    ).expect(409);
    await post(
      `admin/products/${managed.id}/archive`,
      { expectedVersion: managed.version },
      admin,
    ).expect(201);
    await get(`products/${managed.slug}`, "").expect(404);
  });
  it("creates manual customer orders at server prices without changing their cart", async () => {
    const body = {
      customerId,
      items: [{ variantId: variant.id, quantity: 1 }],
      shippingAddress: address,
      paymentMethod: "cod",
    };
    const q = (await post("admin/checkout/quotes", body, admin).expect(201))
      .body.data;
    await post("orders", { quoteId: q.id }).expect(409);
    await post("admin/orders", { quoteId: q.id, totalMinor: 1 }, admin).expect(
      400,
    );
    const result = await post("admin/orders", { quoteId: q.id }, admin).expect(
      201,
    );
    expect(result.body.data.userId).toBe(customerId);
    expect(result.body.data.paymentStatus).toBe("unpaid");
    expect(result.body.data.totalMinor).toBe(137900);
    await get(`orders/${result.body.data.id}`).expect(200);
  });
  it("enforces coupon limits under concurrent order placement", async () => {
    const code = `OFFER-${run.toUpperCase()}`;
    await post(
      "admin/promotions",
      {
        code,
        percent: 10,
        minimumMinor: 0,
        maxUses: 1,
        startsAt: new Date(Date.now() - 60000).toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
        active: true,
      },
      admin,
    ).expect(201);
    const input = {
      customerId,
      items: [{ variantId: variant.id, quantity: 1 }],
      shippingAddress: address,
      paymentMethod: "cod",
      promotionCode: code,
    };
    const quotes = await Promise.all([
      post("admin/checkout/quotes", input, admin),
      post("admin/checkout/quotes", input, admin),
    ]);
    expect(quotes.map((q) => q.status)).toEqual([201, 201]);
    expect(quotes[0].body.data.totals.discountMinor).toBe(12990);
    const results = await Promise.all(
      quotes.map((q) =>
        post("admin/orders", { quoteId: q.body.data.id }, admin),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it("invalidates quotes on policy changes and rejects stale setting updates", async () => {
    const settings = (await get("admin/settings", admin).expect(200)).body.data;
    const q = (
      await post(
        "admin/checkout/quotes",
        {
          customerId,
          items: [{ variantId: variant.id, quantity: 1 }],
          shippingAddress: address,
          paymentMethod: "cod",
        },
        admin,
      ).expect(201)
    ).body.data;
    const input = {
      expectedVersion: settings.version,
      shippingMinor: settings.shippingMinor + 100,
      freeShippingThresholdMinor: settings.freeShippingThresholdMinor,
      taxBasisPoints: settings.taxBasisPoints,
      returnWindowDays: settings.returnWindowDays,
    };
    const updated = await put("admin/settings", input, admin).expect(200);
    await post("admin/orders", { quoteId: q.id }, admin).expect(409);
    await put("admin/settings", input, admin).expect(409);
    await put(
      "admin/settings",
      {
        ...input,
        shippingMinor: settings.shippingMinor,
        expectedVersion: updated.body.data.version,
      },
      admin,
    ).expect(200);
  });
  it("publishes typed storefront content and product collections", async () => {
    const input = {
      storeName: "MyShop",
      announcement: "New collection",
      banners: [
        {
          title: "Shop shirts",
          imageUrl: "https://example.com/banner.webp",
          target: "/shop",
        },
      ],
      contactEmail: "shop@example.com",
      contactPhone: "+8801700000000",
    };
    const draft = (
      await post("admin/storefront/draft", input, admin).expect(201)
    ).body.data;
    await post(
      `admin/storefront/${draft.id}/publish`,
      { expectedVersion: draft.version },
      admin,
    ).expect(201);
    expect((await get("storefront", "")).body.data.announcement).toBe(
      input.announcement,
    );
    await post(
      "admin/collections",
      {
        name: "Featured",
        slug: `featured-${run}`,
        productIds: [product.id],
        active: true,
      },
      admin,
    ).expect(201);
    expect(
      (await get("collections", "")).body.data.some(
        (c: any) => c.slug === `featured-${run}`,
      ),
    ).toBe(true);
    const jobs = await get("admin/jobs", admin).expect(200);
    expect(JSON.stringify(jobs.body)).not.toMatch(/encryptedText|payload/);
  });
  it("enrolls customer MFA and rejects invalid and reused authenticator codes", async () => {
    const user = await auth.register(
      { email: `mfa-${run}@example.com`, name: "MFA Customer", password },
      "test",
    );
    const enrollment = (
      await post(
        "auth/mfa/enrollment",
        { currentPassword: password },
        user.accessToken,
      ).expect(201)
    ).body.data;
    await post(
      "auth/mfa/enrollment/confirm",
      { token: enrollment.token, code: "000000" },
      user.accessToken,
    ).expect(400);
    const step = Math.floor(Date.now() / 30000);
    await post(
      "auth/mfa/enrollment/confirm",
      { token: enrollment.token, code: totp(enrollment.secret, step) },
      user.accessToken,
    ).expect(201);
    await get("me", user.accessToken).expect(401);
    await post("auth/login", { email: user.user.email, password }, "").expect(
      401,
    );
    await post(
      "auth/login",
      {
        email: user.user.email,
        password,
        mfaCode: totp(enrollment.secret, step),
      },
      "",
    ).expect(401);
    await post(
      "auth/login",
      {
        email: user.user.email,
        password,
        mfaCode: totp(enrollment.secret, step + 1),
      },
      "",
    ).expect(201);
  });
  it("applies shared rate limits and returns request IDs/security headers", async () => {
    const res = await get("products", "").expect(
      "X-Content-Type-Options",
      "nosniff",
    );
    expect(res.headers["x-request-id"]).toBeTruthy();
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        post(
          "newsletter/subscriptions",
          {
            email: `newsletter-${run}@example.com`,
            consentRevision: "2026-10",
          },
          "",
        ),
      ),
    );
    expect(responses.some((r) => r.status === 429)).toBe(true);
  });
  it("rejects malformed and oversized JSON without leaking parser details", async () => {
    const malformed = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":')
      .expect(400);
    expect(malformed.body.error.code).toBe("INVALID_JSON");
    const oversized = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "a".repeat(300000) })
      .expect(413);
    expect(oversized.body.error.code).toBe("BODY_TOO_LARGE");
  });
  it("uses single-use reset tokens and revokes earlier sessions", async () => {
    const events = await db
      .getRepository(OutboxEvent)
      .createQueryBuilder("e")
      .addSelect("e.payload")
      .where("e.type = 'email'")
      .orderBy("e.createdAt", "DESC")
      .getMany();
    const email = events.find(
      (e) =>
        e.payload.to === `customer-${run}@example.com` &&
        e.payload.subject === "Reset your MyShop password",
    )!;
    const text = decrypt(
      String(email.payload.encryptedText),
      process.env.APP_ENCRYPTION_KEY!,
    );
    const token = text.match(/token=([A-Za-z0-9_-]{64})/)![1];
    await post(
      "auth/password-reset/complete",
      { token, newPassword: "Changed-strong-password-123!" },
      "",
    ).expect(201);
    await post(
      "auth/password-reset/complete",
      { token, newPassword: "Changed-strong-password-123!" },
      "",
    ).expect(400);
    await get("me", customer).expect(401);
  });
  it("leases queued email across workers and removes delivered token payloads", async () => {
    await db
      .getRepository(OutboxEvent)
      .createQueryBuilder()
      .update()
      .set({ status: "sent" })
      .where("status IN ('pending','processing')")
      .execute();
    const sendMail = jest
      .fn()
      .mockResolvedValue({ messageId: "test-delivery" });
    const transport = jest
      .spyOn(nodemailer, "createTransport")
      .mockReturnValue({
        sendMail,
        close: jest.fn(),
      } as unknown as Transporter);
    const config = new ConfigService({
      WORKER_ENABLED: "true",
      SMTP_URL: "smtp://localhost:1025",
      APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY,
    });
    const workers = [
      new OutboxWorker(db, config),
      new OutboxWorker(db, config),
    ];
    try {
      const event = await db.getRepository(OutboxEvent).save({
        type: "email",
        payload: {
          to: "worker@example.com",
          subject: "Queue verification",
          encryptedText: encrypt(
            "one secret message",
            process.env.APP_ENCRYPTION_KEY!,
          ),
        },
      });
      workers.forEach((worker) => worker.onModuleInit());
      const deadline = Date.now() + 15000;
      while (
        Date.now() < deadline &&
        (await db.getRepository(OutboxEvent).findOneByOrFail({ id: event.id }))
          .status !== "sent"
      )
        await new Promise((resolve) => setTimeout(resolve, 100));
      const delivered = await db
        .getRepository(OutboxEvent)
        .createQueryBuilder("e")
        .addSelect("e.payload")
        .where("e.id = :id", { id: event.id })
        .getOneOrFail();
      expect(delivered.status).toBe("sent");
      expect(delivered.payload).toEqual({});
      expect(delivered.attempts).toBe(1);
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ text: "one secret message" }),
      );
    } finally {
      await Promise.all(
        workers.map((worker) => worker.onApplicationShutdown()),
      );
      transport.mockRestore();
    }
  });

  it("keeps opaque browser sessions revocable and applies the same ownership rules", async () => {
    // Use the already-created customer's actual email rather than deriving ownership from client fields.
    const owner = await db
      .getRepository(User)
      .findOneByOrFail({ id: customerId });
    const value = await auth.login(
      { email: owner.email, password: "Changed-strong-password-123!" },
      "session-test",
    );
    await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", `Session ${value.refreshToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get("/v1/admin/orders")
      .set("Authorization", `Session ${value.refreshToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .post("/v1/auth/logout")
      .set("Authorization", `Session ${value.refreshToken}`)
      .expect(201);
    await request(app.getHttpServer())
      .get("/v1/me")
      .set("Authorization", `Session ${value.refreshToken}`)
      .expect(401);
    customer = (
      await auth.login(
        { email: owner.email, password: "Changed-strong-password-123!" },
        "payment-test",
      )
    ).accessToken;
  });

  it("verifies online payments and refunds once, rejects forged amounts, and holds ambiguous attempts", async () => {
    const config = app.get(ConfigService);
    config.set("SSLCOMMERZ_STORE_ID", "contract-test");
    config.set("SSLCOMMERZ_STORE_PASSWORD", "contract-only");
    config.set("PAYMENT_PUBLIC_URL", "https://api.example.com");
    const client = app.get(SslcommerzClient);
    const init = jest
      .spyOn(client, "initialize")
      .mockResolvedValue("https://sandbox.sslcommerz.com/test-checkout");
    const validate = jest.spyOn(client, "validate");
    const query = jest.spyOn(client, "query");
    const refundInit = jest.spyOn(client, "refund");
    const refundStatus = jest.spyOn(client, "refundStatus");
    const create = async () => {
      await db
        .getRepository(Inventory)
        .increment({ variantId: variant.id }, "available", 5);
      const q = await post(
        "admin/checkout/quotes",
        {
          customerId,
          items: [{ variantId: variant.id, quantity: 1 }],
          shippingAddress: address,
          paymentMethod: "sslcommerz",
        },
        admin,
      ).expect(201);
      const placed = await post(
        "admin/orders",
        { quoteId: q.body.data.id },
        admin,
      ).expect(201);
      expect(placed.body.data.paymentMethod).toBe("sslcommerz");
      return placed.body.data;
    };
    try {
      const online = await create();
      await post(`orders/${online.id}/payment-session`, {}, other).expect(404);
      const starts = await Promise.all([
        post(`orders/${online.id}/payment-session`, {}),
        post(`orders/${online.id}/payment-session`, {}),
      ]);
      expect(starts.some((r) => r.status === 201)).toBe(true);
      expect(init).toHaveBeenCalledTimes(1);
      await post(`orders/${online.id}/payment-session`, {}).expect(201);
      expect(init).toHaveBeenCalledTimes(1);
      const attempt = await db
        .getRepository(GatewayAttempt)
        .findOneByOrFail({ orderId: online.id });
      await post(`orders/${online.id}/cancel`, {
        expectedVersion: online.version,
        reason: "Pending payment cannot release stock",
      }).expect(409);
      const confirmed = {
        status: "VALID",
        currency: "BDT",
        tran_id: attempt.transactionId,
        bank_tran_id: `bank-${run}`,
        amount: (online.totalMinor / 100).toFixed(2),
        risk_level: "0",
      };
      validate.mockResolvedValue({ ...confirmed, amount: "0.01" });
      await post("payments/sslcommerz/ipn", {
        val_id: "test-validation",
      }).expect(502);
      expect(
        (await db.getRepository(Order).findOneByOrFail({ id: online.id }))
          .collectedMinor,
      ).toBe(0);
      validate.mockResolvedValue(confirmed);
      await Promise.all([
        post("payments/sslcommerz/ipn", { val_id: "test-validation" }).expect(
          201,
        ),
        post("payments/sslcommerz/ipn", { val_id: "test-validation" }).expect(
          201,
        ),
      ]);
      expect(
        await db.getRepository(Payment).countBy({ orderId: online.id }),
      ).toBe(1);
      let paid = (await get(`orders/${online.id}`)).body.data;
      await post(
        `admin/orders/${online.id}/refunds`,
        {
          expectedVersion: paid.version,
          amountMinor: online.totalMinor,
          reference: `external-${run}`,
          reason: "Online funds cannot use external COD ledger",
          currentPassword: password,
        },
        admin,
      ).expect(409);
      refundInit.mockResolvedValue({
        APIConnect: "DONE",
        status: "success",
        bank_tran_id: confirmed.bank_tran_id,
        refund_ref_id: `refund-${run}`,
      });
      refundStatus.mockResolvedValue({
        APIConnect: "DONE",
        status: "processing",
        bank_tran_id: confirmed.bank_tran_id,
        tran_id: attempt.transactionId,
        refund_ref_id: `refund-${run}`,
      });
      const intent = key();
      const body = {
        expectedVersion: paid.version,
        amountMinor: online.totalMinor,
        reason: "Customer requested full refund",
        currentPassword: password,
      };
      const pending = await post(
        `admin/orders/${online.id}/gateway-refunds`,
        body,
        admin,
        intent,
      ).expect(201);
      expect(pending.body.data.status).toBe("processing");
      await post(
        `admin/orders/${online.id}/gateway-refunds`,
        body,
        admin,
        intent,
      ).expect(201);
      expect(refundInit).toHaveBeenCalledTimes(1);
      await post(
        `admin/orders/${online.id}/gateway-refunds`,
        body,
        admin,
      ).expect(409);
      refundStatus.mockResolvedValue({
        APIConnect: "DONE",
        status: "refunded",
        bank_tran_id: confirmed.bank_tran_id,
        tran_id: attempt.transactionId,
        refund_ref_id: `refund-${run}`,
      });
      await Promise.all([
        post(
          `admin/gateway/refunds/${pending.body.data.id}/reconcile`,
          {},
          admin,
        ).expect(201),
        post(
          `admin/gateway/refunds/${pending.body.data.id}/reconcile`,
          {},
          admin,
        ).expect(201),
      ]);
      expect(
        await db.getRepository(Refund).countBy({ orderId: online.id }),
      ).toBe(1);
      paid = (await get(`orders/${online.id}`)).body.data;
      expect(paid.paymentStatus).toBe("refunded");
      expect(
        (
          await db
            .getRepository(GatewayRefund)
            .findOneByOrFail({ id: pending.body.data.id })
        ).status,
      ).toBe("refunded");
      await post(`orders/${online.id}/cancel`, {
        expectedVersion: paid.version,
        reason: "Refund has settled",
      }).expect(201);
      const uncertain = await create();
      init.mockRejectedValueOnce(new Error("Simulated network interruption"));
      await post(`orders/${uncertain.id}/payment-session`, {}).expect(500);
      await post(`orders/${uncertain.id}/payment-session`, {}).expect(409);
      await post(`orders/${uncertain.id}/cancel`, {
        expectedVersion: uncertain.version,
        reason: "Ambiguous payment must stay held",
      }).expect(409);
      const unresolved = await db
        .getRepository(GatewayAttempt)
        .findOneByOrFail({ orderId: uncertain.id });
      query.mockResolvedValue({
        APIConnect: "DONE",
        element: [{ tran_id: unresolved.transactionId, status: "FAILED" }],
      });
      await post(
        `admin/orders/${uncertain.id}/payment-reconcile`,
        {},
        admin,
      ).expect(201);
      await post(`orders/${uncertain.id}/cancel`, {
        expectedVersion: uncertain.version,
        reason: "Provider confirmed failure",
      }).expect(201);
      const risky = await create();
      await post(`orders/${risky.id}/payment-session`, {}).expect(201);
      const riskyAttempt = await db
        .getRepository(GatewayAttempt)
        .findOneByOrFail({ orderId: risky.id });
      validate.mockResolvedValue({
        ...confirmed,
        tran_id: riskyAttempt.transactionId,
        bank_tran_id: `risk-${run}`,
        amount: (risky.totalMinor / 100).toFixed(2),
        risk_level: "1",
      });
      await post("payments/sslcommerz/ipn", { val_id: "test-risk" }).expect(
        201,
      );
      const held = (await get(`orders/${risky.id}`)).body.data;
      await post(
        `admin/orders/${risky.id}/process`,
        { expectedVersion: held.version },
        admin,
      ).expect(409);
    } finally {
      jest.restoreAllMocks();
      config.set("SSLCOMMERZ_STORE_ID", "");
      config.set("SSLCOMMERZ_STORE_PASSWORD", "");
    }
  });
});
