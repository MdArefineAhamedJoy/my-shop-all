import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { DataSource, QueryRunner } from "typeorm";
import { databaseOptions } from "../src/database/data-source";
import {
  seedDemo,
  DemoCredentials,
  demoMarkerId,
} from "../src/database/demo/seed";
import {
  demoCustomers,
  demoId,
  demoProducts,
  demoStaff,
} from "../src/database/demo/fixtures";
import { Role, User } from "../src/modules/users/entities/user.entity";
import {
  AuditLog,
  OutboxEvent,
} from "../src/modules/platform/entities/platform.entity";
import { StorefrontRevision } from "../src/modules/content/entities/content.entity";
import { Inventory } from "../src/modules/inventory/entities/inventory.entity";
import { Product } from "../src/modules/catalog/entities/catalog.entity";
import { hashPassword, newTotpSecret } from "../src/modules/auth/crypto";

describe("Local demo dataset against PostgreSQL", () => {
  let db: DataSource;
  let runner: QueryRunner;
  let credentials: DemoCredentials;
  let publishedId: string;
  let outboxCount: number;

  beforeAll(async () => {
    db = await new DataSource(databaseOptions).initialize();
    runner = db.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    const m = runner.manager;
    expect(await m.existsBy(AuditLog, { id: demoMarkerId })).toBe(false);
    const admin = await m.save(
      User,
      m.create(User, {
        email: `demo-test-${randomUUID()}@example.com`,
        name: "Demo test administrator",
        role: Role.ADMIN,
        passwordHash: await hashPassword("Demo-test-administrator-123!"),
      }),
    );
    const published =
      (await m.findOneBy(StorefrontRevision, { published: true })) ??
      (await m.save(
        StorefrontRevision,
        m.create(StorefrontRevision, {
          actorId: admin.id,
          published: true,
          config: { storeName: "Preserve this storefront", banners: [] },
        }),
      ));
    publishedId = published.id;
    outboxCount = await m.count(OutboxEvent);
    credentials = {
      accounts: [
        ...demoCustomers.map(([name]) => ({
          email: `demo.${name.toLowerCase()}@example.com`,
          password: "Demo-test-customer-123!",
        })),
        ...demoStaff.map((staff) => ({
          email: `demo.${staff.key}@example.com`,
          password: "Demo-test-staff-123!",
          mfaSecret: newTotpSecret(),
        })),
      ],
    };
    expect(await seedDemo(m, credentials, "http://localhost:4000")).toEqual({
      inserted: true,
    });
  }, 60000);

  afterAll(async () => {
    if (runner?.isTransactionActive) await runner.rollbackTransaction();
    if (runner) await runner.release();
    if (db?.isInitialized) await db.destroy();
  });

  it("populates all catalog and commerce states without outbound mail", async () => {
    const [counts] = await runner.query(`SELECT
      (SELECT count(*)::int FROM products WHERE slug LIKE 'demo-%') AS products,
      (SELECT count(*)::int FROM variants WHERE sku LIKE 'DEMO-%') AS variants,
      (SELECT count(*)::int FROM orders WHERE order_number LIKE 'DEMO-%') AS orders,
      (SELECT count(*)::int FROM payments WHERE reference LIKE 'DEMO-%') AS payments,
      (SELECT count(*)::int FROM refunds WHERE reference LIKE 'DEMO-%') AS refunds,
      (SELECT count(*)::int FROM returns WHERE reason LIKE 'Demo%') AS returns`);
    expect(counts).toEqual({
      products: 32,
      variants: demoProducts.reduce(
        (n, p) => n + p.colors.length * p.sizes.length,
        0,
      ),
      orders: 40,
      payments: 20,
      refunds: 2,
      returns: 7,
    });
    expect(await runner.manager.count(OutboxEvent)).toBe(outboxCount);
    expect(
      (
        await runner.manager.findOneByOrFail(StorefrontRevision, {
          published: true,
        })
      ).id,
    ).toBe(publishedId);
    const staff = await runner.manager.findOneByOrFail(User, {
      id: demoId("staff:fulfillment"),
    });
    expect(staff.role).toBe(Role.STAFF);
    expect(staff.permissions).not.toContain("refunds:record");
  });

  it("keeps stock ledgers, order totals, payments and refunds consistent", async () => {
    const stockErrors = await runner.query(
      `SELECT i.variant_id FROM inventory i JOIN variants v ON v.id=i.variant_id LEFT JOIN inventory_movements m ON m.variant_id=i.variant_id WHERE v.sku LIKE 'DEMO-%' GROUP BY i.id HAVING i.available <> coalesce(sum(m.quantity),0)`,
    );
    expect(stockErrors).toEqual([]);
    const moneyErrors =
      await runner.query(`SELECT o.id FROM orders o WHERE o.order_number LIKE 'DEMO-%' AND (
      o.collected_minor <> (SELECT coalesce(sum(p.amount_minor),0) FROM payments p WHERE p.order_id=o.id) OR
      o.refunded_minor <> (SELECT coalesce(sum(r.amount_minor),0) FROM refunds r WHERE r.order_id=o.id) OR
      (o.totals->>'subtotalMinor')::int <> (SELECT sum(l.quantity*l.unit_price_minor) FROM order_lines l WHERE l.order_id=o.id) OR
      o.total_minor <> (o.totals->>'totalMinor')::int)`);
    expect(moneyErrors).toEqual([]);
    const invalidLines = await runner.query(
      `SELECT r.id FROM returns r JOIN orders o ON o.id=r.order_id, jsonb_array_elements(r.lines) line WHERE o.order_number LIKE 'DEMO-%' AND NOT EXISTS (SELECT 1 FROM order_lines l WHERE l.order_id=o.id AND l.id=(line->>'orderLineId')::uuid AND l.quantity >= (line->>'quantity')::int)`,
    );
    expect(invalidLines).toEqual([]);
  });

  it("reruns without duplicates, resetting edits or replenishing stock", async () => {
    const m = runner.manager;
    const variantId = demoId("variant:0:0:0");
    await m.update(Product, demoId("product:0"), {
      name: "Edited demo product",
    });
    await m.decrement(Inventory, { variantId }, "available", 1);
    const stock = (await m.findOneByOrFail(Inventory, { variantId })).available;
    const before = await runner.query(
      "SELECT (SELECT count(*) FROM orders) AS orders, (SELECT count(*) FROM audit_logs) AS audits, (SELECT count(*) FROM inventory_movements) AS movements",
    );
    expect(await seedDemo(m, credentials, "http://localhost:4000")).toEqual({
      inserted: false,
    });
    expect(
      (await m.findOneByOrFail(Product, { id: demoId("product:0") })).name,
    ).toBe("Edited demo product");
    expect((await m.findOneByOrFail(Inventory, { variantId })).available).toBe(
      stock,
    );
    expect(
      await runner.query(
        "SELECT (SELECT count(*) FROM orders) AS orders, (SELECT count(*) FROM audit_logs) AS audits, (SELECT count(*) FROM inventory_movements) AS movements",
      ),
    ).toEqual(before);
  });

  it("rejects production even when the completion marker already exists", async () => {
    const env = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      await expect(
        seedDemo(runner.manager, credentials, "https://shop.example.com"),
      ).rejects.toThrow("disabled in production");
    } finally {
      process.env.NODE_ENV = env;
    }
  });
});
