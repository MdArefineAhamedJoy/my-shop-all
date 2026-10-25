import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { randomBytes } from "node:crypto";
import { PlatformService } from "../platform/platform.service";
import { CheckoutService, cartHash } from "../checkout/checkout.service";
import { Quote } from "../checkout/entities/quote.entity";
import { Order, OrderEvent, OrderLine } from "./entities/order.entity";
import {
  Inventory,
  InventoryMovement,
} from "../inventory/entities/inventory.entity";
import { Category, Product, Variant } from "../catalog/entities/catalog.entity";
import { CartItem } from "../cart/entities/cart.entity";
import { lockCart } from "../cart/cart.service";
import { Promotion } from "../promotions/entities/promotion.entity";
import { PlaceOrderDto } from "../checkout/dto/checkout.dto";
import { CancelOrderDto, OrderQuery, ShipOrderDto } from "./dto/order.dto";
import { paginate } from "../../common/api";
import { SettingsService } from "../settings/settings.service";
import { GatewayAttempt } from "../payments/entities/gateway.entity";

@Injectable()
export class OrdersService {
  constructor(
    private db: DataSource,
    private platform: PlatformService,
    private checkout: CheckoutService,
    private settings: SettingsService,
  ) {}
  place(actorId: string, input: PlaceOrderDto, key?: string, manual = false) {
    return this.platform.command(
      `${manual ? "manual-" : ""}place:${actorId}`,
      key,
      input,
      async (m) => {
        if (!manual) await lockCart(m, actorId);
        const quote = await m.findOne(Quote, {
          where: {
            id: input.quoteId,
            ...(manual ? { createdById: actorId } : { userId: actorId }),
          },
          lock: { mode: "pessimistic_write" },
        });
        if (!quote) throw new NotFoundException("Quote not found");
        if (!manual && quote.createdById)
          throw new ConflictException(
            "Staff quotes must be placed by their creator through the admin endpoint",
          );
        const userId = quote.userId;
        const policy = await this.settings.get(m);
        if (policy.version !== quote.policyVersion)
          throw new ConflictException(
            "Pricing policy changed; request a new quote",
          );
        if (quote.usedAt || quote.expiresAt < new Date())
          throw new ConflictException("Quote is used or expired");
        const items = await m.find(CartItem, {
          where: { userId },
          order: { variantId: "ASC" },
          take: 101,
        });
        if (!manual && cartHash(items) !== quote.cartHash)
          throw new ConflictException("Cart changed; request a new quote");
        // Lock variants in deterministic order so concurrent price changes cannot race checkout.
        const ids = quote.lines.map((l) => l.variantId).sort();
        const productIds = [
          ...new Set(quote.lines.map((l) => l.productId)),
        ].sort();
        const products = await m
          .getRepository(Product)
          .createQueryBuilder("p")
          .where("p.id IN (:...productIds)", { productIds })
          .orderBy("p.id", "ASC")
          .setLock("pessimistic_read")
          .getMany();
        const categoryIds = [
          ...new Set(products.map((p) => p.categoryId)),
        ].sort();
        if (categoryIds.length)
          await m
            .getRepository(Category)
            .createQueryBuilder("c")
            .where("c.id IN (:...categoryIds)", { categoryIds })
            .orderBy("c.id", "ASC")
            .setLock("pessimistic_read")
            .getMany();
        const variants = await m
          .getRepository(Variant)
          .createQueryBuilder("v")
          .where("v.id IN (:...ids)", { ids })
          .orderBy("v.id", "ASC")
          .setLock("pessimistic_write")
          .getMany();
        const current = new Map(variants.map((v) => [v.id, v]));
        // Revalidate publication/category and price under the same transaction.
        const lines = await this.checkout.resolveLines(
          m,
          manual ? quote.lines : items,
        );
        for (const line of quote.lines) {
          if (
            !current.get(line.variantId)?.active ||
            current.get(line.variantId)?.priceMinor !== line.unitPriceMinor ||
            !lines.some((l) => l.variantId === line.variantId)
          )
            throw new ConflictException("QUOTE_CHANGED: request a new quote");
        }
        if (quote.promotionId) {
          const promotion = await m.findOne(Promotion, {
            where: { id: quote.promotionId },
            lock: { mode: "pessimistic_write" },
          });
          if (
            !promotion ||
            !promotion.active ||
            promotion.startsAt > new Date() ||
            promotion.endsAt < new Date() ||
            promotion.usedCount >= promotion.maxUses ||
            quote.totals.subtotalMinor < promotion.minimumMinor ||
            Math.floor(
              (quote.totals.subtotalMinor * promotion.percent) / 100,
            ) !== quote.totals.discountMinor
          )
            throw new ConflictException(
              "Promotion changed or exhausted; request a new quote",
            );
          promotion.usedCount++;
          await m.save(promotion);
        }
        const order = await m.save(
          Order,
          m.create(Order, {
            userId,
            quoteId: quote.id,
            orderNumber: `MS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomBytes(8).toString("hex").toUpperCase()}`,
            totals: quote.totals,
            totalMinor: quote.totals.totalMinor,
            shippingAddress: quote.shippingAddress,
            paymentMethod: quote.paymentMethod,
          }),
        );
        for (const line of [...quote.lines].sort((a, b) =>
          a.variantId.localeCompare(b.variantId),
        )) {
          const result = await m
            .createQueryBuilder()
            .update(Inventory)
            .set({ available: () => "available - :quantity" })
            .where("variant_id = :variantId AND available >= :quantity", {
              variantId: line.variantId,
              quantity: line.quantity,
            })
            .execute();
          if (!result.affected)
            throw new ConflictException(`OUT_OF_STOCK: ${line.sku}`);
          const { productId: _productId, ...snapshot } = line;
          await m.save(
            OrderLine,
            m.create(OrderLine, { ...snapshot, orderId: order.id }),
          );
          await m.save(
            InventoryMovement,
            m.create(InventoryMovement, {
              variantId: line.variantId,
              quantity: -line.quantity,
              actorId,
              orderId: order.id,
              reason: "Order placed",
            }),
          );
        }
        quote.usedAt = new Date();
        await m.save(quote);
        if (!manual) await m.delete(CartItem, { userId });
        await this.event(m, order.id, actorId, "placed", "Order placed");
        if (manual)
          await this.platform.audit(
            m,
            actorId,
            "order.manual-create",
            order.id,
            { customerId: userId },
          );
        await this.platform.enqueue(m, "order.placed", { orderId: order.id });
        return order;
      },
    );
  }
  async list(userId: string | null, query: OrderQuery) {
    const qb = this.db.getRepository(Order).createQueryBuilder("o");
    if (userId) qb.where("o.userId = :userId", { userId });
    if (query.status)
      qb.andWhere("o.status = :status", { status: query.status });
    const page = await paginate(
      qb,
      query,
      `orders:${userId}:${query.status || ""}`,
    );
    const lines = page.data.length
      ? await this.db
          .getRepository(OrderLine)
          .findBy({ orderId: In(page.data.map((o) => o.id)) })
      : [];
    return {
      ...page,
      data: page.data.map((order) => ({
        ...order,
        lines: lines.filter((line) => line.orderId === order.id),
      })),
    };
  }
  async detail(id: string, userId: string | null) {
    const order = await this.db
      .getRepository(Order)
      .findOneBy({ id, ...(userId ? { userId } : {}) });
    if (!order) throw new NotFoundException("Order not found");
    const [lines, events] = await Promise.all([
      this.db
        .getRepository(OrderLine)
        .find({ where: { orderId: id }, order: { id: "ASC" }, take: 100 }),
      this.db.getRepository(OrderEvent).find({
        where: { orderId: id },
        order: { createdAt: "ASC", id: "ASC" },
        take: 100,
      }),
    ]);
    return {
      ...order,
      lines,
      events: events.filter((e) => (userId ? e.type !== "note" : true)),
    };
  }
  async locked(
    m: EntityManager,
    id: string,
    expectedVersion: number,
    userId?: string,
  ) {
    const order = await m.findOne(Order, {
      where: { id, ...(userId ? { userId } : {}) },
      lock: { mode: "pessimistic_write" },
    });
    if (!order) throw new NotFoundException();
    if (order.version !== expectedVersion)
      throw new ConflictException("VERSION_CONFLICT");
    return order;
  }
  event(
    m: EntityManager,
    orderId: string,
    actorId: string,
    type: string,
    message: string,
  ) {
    return m.save(
      OrderEvent,
      m.create(OrderEvent, { orderId, actorId, type, message }),
    );
  }
  cancel(
    actorId: string,
    id: string,
    input: CancelOrderDto,
    admin: boolean,
    key?: string,
  ) {
    return this.platform.command(
      `cancel:${actorId}:${id}`,
      key,
      input,
      async (m) => {
        const order = await this.locked(
          m,
          id,
          input.expectedVersion,
          admin ? undefined : actorId,
        );
        if (!["pending", "processing"].includes(order.status))
          throw new ConflictException(
            "Order cannot be cancelled in its current state",
          );
        if (order.collectedMinor > order.refundedMinor)
          throw new ConflictException(
            "Refund collected funds before cancelling",
          );
        const attempt = await m.findOneBy(GatewayAttempt, { orderId: id });
        if (attempt && !["failed", "paid", "risk"].includes(attempt.status))
          throw new ConflictException(
            "Reconcile the pending online payment before cancelling",
          );
        const lines = await m.find(OrderLine, {
          where: { orderId: id },
          order: { variantId: "ASC" },
        });
        for (const line of lines) {
          await m.increment(
            Inventory,
            { variantId: line.variantId },
            "available",
            line.quantity,
          );
          await m.save(
            InventoryMovement,
            m.create(InventoryMovement, {
              variantId: line.variantId,
              quantity: line.quantity,
              actorId,
              orderId: id,
              reason: "Order cancelled",
            }),
          );
        }
        order.status = "cancelled";
        order.cancellationReason = input.reason;
        await this.event(m, id, actorId, "cancelled", "Order cancelled");
        await this.platform.audit(m, actorId, "order.cancel", id, {
          reason: input.reason,
        });
        return m.save(order);
      },
    );
  }
  transition(
    actorId: string,
    id: string,
    version: number,
    action: "process" | "ship" | "deliver",
    input: ShipOrderDto | null,
    key?: string,
  ) {
    return this.platform.command(
      `${action}:${actorId}:${id}`,
      key,
      { version, input },
      async (m) => {
        const order = await this.locked(m, id, version);
        if (order.paymentMethod === "sslcommerz") {
          const attempt = await m.findOneBy(GatewayAttempt, { orderId: id });
          if (order.paymentStatus !== "paid" || attempt?.status !== "paid")
            throw new ConflictException(
              "Fulfillment requires a verified safe online payment",
            );
        }
        const transitions = {
          process: ["pending", "processing"],
          ship: ["processing", "shipped"],
          deliver: ["shipped", "delivered"],
        };
        const [from, to] = transitions[action];
        if (order.status !== from)
          throw new ConflictException(`Order must be ${from}`);
        order.status = to;
        if (input) {
          order.courier = input.courier;
          order.trackingNumber = input.trackingNumber;
        }
        if (action === "deliver") order.deliveredAt = new Date();
        await this.event(m, id, actorId, to, `Order ${to}`);
        await this.platform.audit(m, actorId, `order.${action}`, id);
        return m.save(order);
      },
    );
  }
  async note(actorId: string, id: string, message: string) {
    return this.db.transaction(async (m) => {
      if (!(await m.existsBy(Order, { id }))) throw new NotFoundException();
      return this.event(m, id, actorId, "note", message);
    });
  }
}
