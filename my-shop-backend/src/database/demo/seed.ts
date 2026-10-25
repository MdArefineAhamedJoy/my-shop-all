import {
  EntityManager,
  DeepPartial,
  EntityTarget,
  FindOptionsWhere,
} from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { BaseEntity } from "../../common/base.entity";
import { Role, User } from "../../modules/users/entities/user.entity";
import {
  Address,
  AddressSnapshot,
} from "../../modules/users/entities/address.entity";
import {
  Category,
  Product,
  Variant,
} from "../../modules/catalog/entities/catalog.entity";
import {
  Inventory,
  InventoryMovement,
} from "../../modules/inventory/entities/inventory.entity";
import {
  CartItem,
  WishlistItem,
} from "../../modules/cart/entities/cart.entity";
import { Quote, QuoteLine } from "../../modules/checkout/entities/quote.entity";
import {
  calculateTotals,
  cartHash,
} from "../../modules/checkout/checkout.service";
import {
  Order,
  OrderEvent,
  OrderLine,
} from "../../modules/orders/entities/order.entity";
import {
  Payment,
  Refund,
} from "../../modules/payments/entities/payment.entity";
import { ReturnRequest } from "../../modules/returns/entities/return.entity";
import { Promotion } from "../../modules/promotions/entities/promotion.entity";
import {
  Collection,
  NewsletterSubscription,
  StorefrontRevision,
} from "../../modules/content/entities/content.entity";
import { AuditLog } from "../../modules/platform/entities/platform.entity";
import {
  SETTINGS_ID,
  StoreSettings,
} from "../../modules/settings/entities/settings.entity";
import { encrypt, hashPassword } from "../../modules/auth/crypto";
import {
  demoCategories,
  demoCustomers,
  demoId,
  demoProducts,
  demoStaff,
  slugify,
} from "./fixtures";

export interface DemoAccount {
  email: string;
  password: string;
  mfaSecret?: string;
}
export interface DemoCredentials {
  accounts: DemoAccount[];
}
export const demoMarkerId = demoId("complete");
const note = "Synthetic development fixture; no money moved and no email sent.";

/** Caller owns the transaction, so a failed seed leaves no partial commerce graph. */
export async function seedDemo(
  m: EntityManager,
  credentials: DemoCredentials,
  appUrl: string,
  now = new Date(),
) {
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo data is disabled in production");
  if (!m.queryRunner?.isTransactionActive)
    throw new Error("Demo seeding requires a transaction");
  await m.query("SELECT pg_advisory_xact_lock(hashtextextended('seed',0))");
  if (await m.existsBy(AuditLog, { id: demoMarkerId }))
    return { inserted: false };
  const admin = await m.findOneBy(User, { role: Role.ADMIN, active: true });
  if (!admin) throw new Error("Run the administrator seed before seed:demo");
  const ago = (days: number) => new Date(now.getTime() - days * 86400000);
  const after = (date: Date, hours: number) =>
    new Date(date.getTime() + hours * 3600000);
  const insert = async <T extends BaseEntity>(
    entity: EntityTarget<T>,
    key: string,
    fields: DeepPartial<T>,
  ): Promise<T> => {
    const id = demoId(key);
    const row = m.create(entity, { id, ...fields } as DeepPartial<T>);
    await m
      .getRepository(entity)
      .createQueryBuilder()
      .insert()
      .values(row as unknown as QueryDeepPartialEntity<T>)
      .execute();
    return m.findOneByOrFail(entity, { id } as FindOptionsWhere<T>);
  };
  // This is a versioned, atomic dataset. A marker is written only after every row succeeds.
  // Existing fixture IDs/natural keys are deliberately rejected, never overwritten.
  const policy =
    (await m.findOneBy(StoreSettings, { id: SETTINGS_ID })) ??
    (await m.save(
      StoreSettings,
      m.create(StoreSettings, {
        id: SETTINGS_ID,
        shippingMinor: 8000,
        freeShippingThresholdMinor: 300000,
        taxBasisPoints: 0,
        returnWindowDays: 14,
      }),
    ));
  const audit = (
    key: string,
    action: string,
    entityId: string,
    createdAt = now,
  ) =>
    insert(AuditLog, `audit:${key}`, {
      actorId: admin.id,
      action,
      entityId,
      createdAt,
      details: { demo: true, note },
    });
  const customers: { user: User; address: AddressSnapshot }[] = [];
  for (const [i, [name, city, postalCode]] of demoCustomers.entries()) {
    const email = `demo.${name.toLowerCase()}@example.com`;
    const account = credentials.accounts.find((a) => a.email === email);
    if (!account) throw new Error(`Missing demo credentials for ${email}`);
    const user = await insert(User, `customer:${i}`, {
      email,
      name: `${name} Demo`,
      phone: "+8800000000000",
      role: Role.CUSTOMER,
      emailVerified: true,
      passwordHash: await hashPassword(account.password),
      createdAt: ago(45 + i),
    });
    const address: AddressSnapshot = {
      name: user.name,
      phone: user.phone!,
      line1: `${i + 1} Demo Road (fictional address)`,
      line2: "Sample delivery address - demo only",
      city,
      region: city,
      postalCode,
      countryCode: "BD",
    };
    await insert(Address, `address:${i}`, {
      userId: user.id,
      label: "Demo home",
      details: address,
      isDefault: true,
    });
    await insert(Address, `address:${i}:office`, {
      userId: user.id,
      label: "Demo office",
      details: { ...address, line1: `${i + 1} Sample Office Road (fictional)` },
      isDefault: false,
    });
    await insert(NewsletterSubscription, `newsletter:${i}`, {
      email,
      confirmed: true,
      consentRevision: "demo-fixture-v1",
    });
    customers.push({ user, address });
  }
  for (const staff of demoStaff) {
    const account = credentials.accounts.find(
      (a) => a.email === `demo.${staff.key}@example.com`,
    );
    if (!account?.mfaSecret)
      throw new Error("Missing demo staff MFA enrollment");
    const user = await insert(User, `staff:${staff.key}`, {
      email: account.email,
      name: staff.name,
      role: Role.STAFF,
      emailVerified: true,
      passwordHash: await hashPassword(account.password),
      permissions: staff.permissions,
      mfaSecret: encrypt(account.mfaSecret, process.env.APP_ENCRYPTION_KEY!),
    });
    await audit(`staff:${staff.key}`, "demo.staff.create", user.id);
  }
  const categoryIds = new Map<string, string>();
  for (const [i, name] of demoCategories.entries()) {
    const slug = slugify(name);
    const existing = await m.findOneBy(Category, { slug });
    const category =
      existing ??
      (await insert(Category, `category:${slug}`, {
        name,
        slug,
        sortOrder: i,
      }));
    categoryIds.set(name, category.id);
  }
  const products: { product: Product; variants: Variant[] }[] = [];
  for (const [i, fixture] of demoProducts.entries()) {
    const createdAt = ago(35 - i / 2);
    const product = await insert(Product, `product:${i}`, {
      name: fixture.name,
      slug: `demo-${slugify(fixture.name)}`,
      categoryId: categoryIds.get(fixture.category)!,
      description: `${fixture.name} with comfortable fabric and an easy everyday fit. Available in multiple sizes and colors. This is a fictional demo catalog item for testing the store.`,
      gender: fixture.gender,
      status: "published",
      publishedAt: createdAt,
      createdAt,
      images: [
        `${appUrl.replace(/\/$/, "")}/v1/media/images/${demoId(`image:${fixture.image}`)}.webp`,
      ],
      tags: [
        "demo",
        ...(i % 2 === 0 ? ["new-arrival"] : []),
        ...(i % 3 === 0 ? ["bestseller"] : []),
        ...(i % 4 === 0 ? ["trending"] : []),
        ...(i % 5 === 0 ? ["premium"] : []),
      ],
      isFeatured: i % 3 === 0,
      isNew: i % 2 === 0,
    });
    const variants: Variant[] = [];
    for (const [c, color] of fixture.colors.entries()) {
      for (const [s, size] of fixture.sizes.entries()) {
        const key = `variant:${i}:${c}:${s}`;
        const variant = await insert(Variant, key, {
          productId: product.id,
          sku: `DEMO-${String(i + 1).padStart(3, "0")}-${color.toUpperCase()}-${size.toUpperCase()}`,
          size,
          color,
          priceMinor: fixture.price * 100,
          compareAtMinor: i % 3 === 0 ? (fixture.price + 500) * 100 : null,
        });
        // Last color/size includes low and zero stock examples; ordered variants remain available.
        const stock =
          c === 1 && s === fixture.sizes.length - 1 && i % 4 === 0
            ? 0
            : c === 1 && s === fixture.sizes.length - 1 && i % 3 === 0
              ? 3
              : 35 + (i % 20);
        await insert(Inventory, `inventory:${key}`, {
          variantId: variant.id,
          available: stock,
          createdAt,
        });
        if (stock)
          await insert(InventoryMovement, `stock:${key}`, {
            variantId: variant.id,
            quantity: stock,
            actorId: admin.id,
            reason: "DEMO initial inventory",
            createdAt,
          });
        variants.push(variant);
      }
    }
    products.push({ product, variants });
    await audit(`product:${i}`, "demo.product.create", product.id, createdAt);
  }
  for (const [i, customer] of customers.entries()) {
    for (let n = 0; n < 2; n++) {
      const entry = products[(i * 2 + n) % products.length];
      await insert(CartItem, `cart:${i}:${n}`, {
        userId: customer.user.id,
        variantId: entry.variants[0].id,
        quantity: n + 1,
      });
    }
    for (let n = 0; n < 3; n++)
      await insert(WishlistItem, `wishlist:${i}:${n}`, {
        userId: customer.user.id,
        productId: products[(i + n * 3) % products.length].product.id,
      });
  }

  const returnStates = [
    "requested",
    "approved",
    "rejected",
    "received",
    "inspected",
    "closed",
    "closed",
  ];
  let returnCount = 0;
  for (let i = 0; i < 40; i++) {
    const customer = customers[i % customers.length];
    const status = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "delivered",
      "delivered",
      "delivered",
      "cancelled",
    ][i % 8];
    const createdAt = ago((i + 1) * 0.7);
    const lines: QuoteLine[] = [
      products[i % products.length],
      products[(i + 7) % products.length],
    ].map((entry, n) => {
      const variant = entry.variants[0];
      return {
        variantId: variant.id,
        productId: entry.product.id,
        name: entry.product.name,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        quantity: n + 1,
        unitPriceMinor: variant.priceMinor,
      };
    });
    const totals = calculateTotals(
      lines.reduce((s, l) => s + l.quantity * l.unitPriceMinor, 0),
      0,
      policy.shippingMinor,
      policy.freeShippingThresholdMinor,
      policy.taxBasisPoints,
    );
    const quote = await insert(Quote, `quote:${i}`, {
      userId: customer.user.id,
      lines,
      totals,
      shippingAddress: customer.address,
      paymentMethod: "cod",
      cartHash: cartHash(lines),
      expiresAt: after(createdAt, 1 / 12),
      usedAt: createdAt,
      createdAt,
      policyVersion: policy.version,
    });
    const deliveredAt = status === "delivered" ? after(createdAt, 24) : null;
    const order = await insert(Order, `order:${i}`, {
      orderNumber: `DEMO-${String(i + 1).padStart(5, "0")}`,
      userId: customer.user.id,
      quoteId: quote.id,
      status,
      paymentStatus: deliveredAt ? "paid" : "unpaid",
      paymentMethod: "cod",
      totals,
      totalMinor: totals.totalMinor,
      collectedMinor: deliveredAt ? totals.totalMinor : 0,
      shippingAddress: customer.address,
      createdAt,
      deliveredAt,
      courier: ["shipped", "delivered"].includes(status)
        ? "Demo Courier (fictional)"
        : null,
      trackingNumber: ["shipped", "delivered"].includes(status)
        ? `DEMO-TRACK-${String(i + 1).padStart(5, "0")}`
        : null,
      cancellationReason:
        status === "cancelled" ? "Demo customer changed their mind" : null,
    });
    const orderLines: OrderLine[] = [];
    for (const [n, line] of lines.entries()) {
      orderLines.push(
        await insert(OrderLine, `line:${i}:${n}`, {
          orderId: order.id,
          variantId: line.variantId,
          name: line.name,
          sku: line.sku,
          size: line.size,
          color: line.color,
          quantity: line.quantity,
          unitPriceMinor: line.unitPriceMinor,
          createdAt,
        }),
      );
      const inventory = await m.findOneOrFail(Inventory, {
        where: { variantId: line.variantId },
        lock: { mode: "pessimistic_write" },
      });
      if (inventory.available < line.quantity)
        throw new Error(
          "Insufficient stock for demo orders; transaction rolled back",
        );
      await m.decrement(
        Inventory,
        { id: inventory.id },
        "available",
        line.quantity,
      );
      await insert(InventoryMovement, `sale:${i}:${n}`, {
        variantId: line.variantId,
        quantity: -line.quantity,
        actorId: admin.id,
        orderId: order.id,
        reason: `DEMO order ${order.orderNumber}`,
        createdAt,
      });
      if (status === "cancelled") {
        await m.increment(
          Inventory,
          { id: inventory.id },
          "available",
          line.quantity,
        );
        await insert(InventoryMovement, `cancel:${i}:${n}`, {
          variantId: line.variantId,
          quantity: line.quantity,
          actorId: admin.id,
          orderId: order.id,
          reason: "DEMO cancellation restock",
          createdAt: after(createdAt, 6),
        });
      }
    }
    const transitions =
      status === "cancelled"
        ? ["placed", "cancelled"]
        : [
            "placed",
            ...["processing", "shipped", "delivered"].slice(
              0,
              ["pending", "processing", "shipped", "delivered"].indexOf(status),
            ),
          ];
    for (const [n, type] of transitions.entries())
      await insert(OrderEvent, `event:${i}:${type}`, {
        orderId: order.id,
        actorId: admin.id,
        type,
        message: `DEMO ${type}: ${note}`,
        createdAt: after(createdAt, n * 8),
      });
    await audit(`order:${i}`, "demo.order.create", order.id, createdAt);
    if (deliveredAt) {
      const payment = await insert(Payment, `payment:${i}`, {
        orderId: order.id,
        amountMinor: totals.totalMinor,
        reference: `DEMO-COD-${i + 1}`,
        evidence: note,
        actorId: admin.id,
        collectedAt: after(deliveredAt, 1),
        createdAt: after(deliveredAt, 1),
      });
      await audit(
        `payment:${i}`,
        "demo.cod.collection",
        payment.id,
        payment.collectedAt,
      );
      if (returnCount < returnStates.length) {
        const r = returnCount++;
        const state = returnStates[r];
        const inspected = ["inspected", "closed"].includes(state);
        const returned = r === 6 ? orderLines : orderLines.slice(0, 1);
        const returnLines = returned.map((l) => ({
          orderLineId: l.id,
          quantity: r === 6 ? l.quantity : 1,
          ...(inspected ? { restockQuantity: r === 6 ? l.quantity : 1 } : {}),
        }));
        const request = await insert(ReturnRequest, `return:${r}`, {
          orderId: order.id,
          userId: customer.user.id,
          lines: returnLines,
          reason:
            r % 2 ? "Demo size exchange requested" : "Demo item did not fit",
          status: state,
          staffNote: `DEMO ${state}. ${note}`,
          createdAt: after(deliveredAt, 3),
        });
        await audit(
          `return:${r}`,
          `demo.return.${state}`,
          request.id,
          after(deliveredAt, 3),
        );
        if (inspected)
          for (const [n, line] of returned.entries()) {
            const quantity = returnLines[n].quantity;
            await m.increment(
              Inventory,
              { variantId: line.variantId },
              "available",
              quantity,
            );
            await insert(InventoryMovement, `return-stock:${r}:${n}`, {
              variantId: line.variantId,
              quantity,
              actorId: admin.id,
              orderId: order.id,
              reason: `DEMO inspected return ${request.id}`,
              createdAt: after(deliveredAt, 4),
            });
          }
        if (state === "closed") {
          const amountMinor =
            r === 6
              ? totals.totalMinor
              : Math.floor(
                  (orderLines[0].unitPriceMinor *
                    (totals.subtotalMinor + totals.taxMinor)) /
                    totals.subtotalMinor,
                );
          const refund = await insert(Refund, `refund:${r}`, {
            orderId: order.id,
            amountMinor,
            reference: `DEMO-REFUND-${r}`,
            reason: note,
            actorId: admin.id,
            createdAt: after(deliveredAt, 5),
          });
          await m.update(Order, order.id, {
            refundedMinor: amountMinor,
            paymentStatus:
              amountMinor === totals.totalMinor
                ? "refunded"
                : "partially_refunded",
          });
          await audit(
            `refund:${r}`,
            "demo.refund.record",
            refund.id,
            refund.createdAt,
          );
        }
      }
    }
  }
  for (const [i, code] of [
    "DEMO10",
    "DEMO15",
    "DEMOVIP20",
    "DEMOEXPIRED",
    "DEMODISABLED",
  ].entries()) {
    await insert(Promotion, `promotion:${i}`, {
      code,
      percent: [10, 15, 20, 10, 5][i],
      minimumMinor: i === 0 ? 0 : 200000,
      maxUses: 500,
      usedCount: 0,
      startsAt: ago(15),
      endsAt: i === 3 ? ago(1) : after(now, 24 * 90),
      active: i !== 4,
    });
  }
  for (const [name, indices] of [
    ["New Arrivals", products.map((_, i) => i).filter((i) => i % 2 === 0)],
    ["Bestsellers", products.map((_, i) => i).filter((i) => i % 3 === 0)],
    ["Trending", products.map((_, i) => i).filter((i) => i % 4 === 0)],
    [
      "Premium Essentials",
      products.map((_, i) => i).filter((i) => i % 5 === 0),
    ],
    [
      "Women's Edit",
      products.map((_, i) => i).filter((i) => i >= 16 && i < 24),
    ],
    ["Little Ones", [24, 25, 26, 27]],
  ] as [string, number[]][]) {
    await insert(Collection, `collection:${name}`, {
      name,
      slug: `demo-${slugify(name)}`,
      productIds: indices.map((i) => products[i].product.id),
      active: true,
    });
  }
  const published = await m.existsBy(StorefrontRevision, { published: true });
  const revision = await insert(StorefrontRevision, "storefront", {
    actorId: admin.id,
    published: !published,
    config: {
      storeName: "MyShop Demo",
      announcement:
        "Demo store • Try DEMO10 for 10% off • All order history is fictional",
      contactEmail: "support@example.com",
      contactPhone: "+8800000000000",
      banners: [
        {
          title: "Fresh styles for every day",
          subtitle: "Explore our new arrivals",
          imageUrl:
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop",
          target: "/new-arrivals",
        },
        {
          title: "The women's edit",
          subtitle: "Comfortable fits and effortless style",
          imageUrl:
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop",
          target: "/women",
        },
      ],
    },
  });
  await audit(
    "storefront",
    published ? "demo.storefront.draft" : "demo.storefront.publish",
    revision.id,
  );
  await insert(AuditLog, "complete", {
    actorId: admin.id,
    action: "demo.seed.complete",
    entityId: demoMarkerId,
    details: {
      demo: true,
      dataset: "v1",
      products: demoProducts.length,
      customers: demoCustomers.length,
      orders: 40,
      note,
    },
  });
  return { inserted: true };
}
