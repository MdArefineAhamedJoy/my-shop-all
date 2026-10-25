import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource, In } from "typeorm";
import { randomBytes } from "node:crypto";
import { GatewayAttempt, GatewayRefund } from "./entities/gateway.entity";
import { Order, OrderLine } from "../orders/entities/order.entity";
import { Payment, Refund } from "./entities/payment.entity";
import { User } from "../users/entities/user.entity";
import { OrdersService } from "../orders/orders.service";
import { PlatformService } from "../platform/platform.service";
import { verifyPassword } from "../auth/crypto";
import { decimalMinor, SslcommerzClient } from "./sslcommerz.client";
import { PageQuery, paginate } from "../../common/api";
import type { GatewayRefundDto } from "./gateway.controller";

@Injectable()
export class GatewayService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private working = false;
  constructor(
    private db: DataSource,
    private config: ConfigService,
    private provider: SslcommerzClient,
    private orders: OrdersService,
    private platform: PlatformService,
  ) {}
  onModuleInit() {
    if (this.config.get("WORKER_ENABLED") === "true" && this.provider.enabled) {
      this.timer = setInterval(() => void this.sweep(), 60000);
      this.timer.unref();
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  list(query: PageQuery) {
    return paginate(
      this.db.getRepository(GatewayAttempt).createQueryBuilder("g"),
      query,
      "gateway",
    );
  }
  refunds(query: PageQuery) {
    return paginate(
      this.db.getRepository(GatewayRefund).createQueryBuilder("g"),
      query,
      "gateway-refunds",
    );
  }
  async initialize(userId: string, orderId: string) {
    if (!this.provider.enabled)
      throw new ConflictException("Online payment is not configured");
    const prepared = await this.db.transaction(async (m) => {
      const order = await m.findOne(Order, {
        where: { id: orderId, userId },
        lock: { mode: "pessimistic_write" },
      });
      if (!order) throw new NotFoundException();
      if (
        order.paymentMethod !== "sslcommerz" ||
        order.status === "cancelled" ||
        order.collectedMinor
      )
        throw new ConflictException("Order cannot accept an online payment");
      let attempt = await m
        .getRepository(GatewayAttempt)
        .createQueryBuilder("g")
        .addSelect("g.checkoutUrl")
        .where("g.orderId=:orderId", { orderId })
        .getOne();
      if (attempt) {
        if (
          attempt.status === "pending" &&
          attempt.checkoutUrl &&
          Date.now() - attempt.createdAt.getTime() < 1800000
        )
          return { url: attempt.checkoutUrl, order, attempt };
        throw new ConflictException(
          "A payment already exists; check payment status or contact support before retrying",
        );
      }
      attempt = await m.save(
        GatewayAttempt,
        m.create(GatewayAttempt, {
          orderId,
          transactionId: randomBytes(15).toString("hex"),
          status: "initializing",
        }),
      );
      return { order, attempt, url: null };
    });
    if (prepared.url) return { checkoutUrl: prepared.url };
    const { order, attempt } = prepared;
    const user = await this.db
      .getRepository(User)
      .findOneByOrFail({ id: userId });
    const lines = await this.db.getRepository(OrderLine).findBy({ orderId });
    const a = order.shippingAddress;
    const callback = `${this.config.getOrThrow<string>("PAYMENT_PUBLIC_URL").replace(/\/$/, "")}/v1/payments/sslcommerz`;
    try {
      const url = await this.provider.initialize({
        total_amount: (order.totalMinor / 100).toFixed(2),
        currency: "BDT",
        tran_id: attempt.transactionId,
        success_url: `${callback}/return/${order.id}`,
        fail_url: `${callback}/return/${order.id}`,
        cancel_url: `${callback}/return/${order.id}`,
        ipn_url: `${callback}/ipn`,
        cus_name: a.name.slice(0, 50),
        cus_email: user.email,
        cus_add1: a.line1.slice(0, 50),
        cus_city: a.city.slice(0, 50),
        cus_state: a.region.slice(0, 50),
        cus_postcode: a.postalCode,
        cus_country: "Bangladesh",
        cus_phone: a.phone,
        shipping_method: "Courier",
        ship_name: a.name.slice(0, 50),
        ship_add1: a.line1.slice(0, 50),
        ship_city: a.city.slice(0, 50),
        ship_state: a.region.slice(0, 50),
        ship_postcode: a.postalCode,
        ship_country: "Bangladesh",
        num_of_item: String(lines.reduce((n, l) => n + l.quantity, 0)),
        product_name: `Order ${order.orderNumber}`,
        product_category: "clothing",
        product_profile: "physical-goods",
        emi_option: "0",
      });
      await this.db
        .getRepository(GatewayAttempt)
        .update(
          { id: attempt.id, status: "initializing" },
          { status: "pending", checkoutUrl: url },
        );
      return { checkoutUrl: url };
    } catch (error) {
      await this.db
        .getRepository(GatewayAttempt)
        .update(
          { id: attempt.id, status: "initializing" },
          { status: "unknown" },
        );
      throw error;
    }
  }
  async notify(body: Record<string, unknown>) {
    if (typeof body.val_id !== "string" || !/^[\w-]{1,150}$/.test(body.val_id))
      throw new BadRequestException("Valid val_id is required");
    const value = await this.provider.validate(body.val_id);
    await this.settle(value);
    return { received: true };
  }
  private async settle(value: Record<string, any>) {
    if (
      !["VALID", "VALIDATED"].includes(value.status) ||
      value.currency !== "BDT" ||
      typeof value.tran_id !== "string" ||
      typeof value.bank_tran_id !== "string" ||
      !value.bank_tran_id ||
      value.bank_tran_id.length > 120 ||
      !["0", "1"].includes(String(value.risk_level))
    )
      throw new BadGatewayException("Payment validation failed");
    const attempt = await this.db
      .getRepository(GatewayAttempt)
      .findOneBy({ transactionId: value.tran_id });
    if (!attempt) throw new NotFoundException("Unknown payment");
    await this.db.transaction(async (m) => {
      const order = await m.findOneOrFail(Order, {
        where: { id: attempt.orderId },
        lock: { mode: "pessimistic_write" },
      });
      const locked = await m.findOneOrFail(GatewayAttempt, {
        where: { id: attempt.id },
        lock: { mode: "pessimistic_write" },
      });
      if (
        decimalMinor(value.amount) !== order.totalMinor ||
        order.paymentMethod !== "sslcommerz"
      )
        throw new BadGatewayException("Payment amount or currency mismatch");
      if (locked.bankTransactionId) {
        if (locked.bankTransactionId !== value.bank_tran_id)
          throw new ConflictException("Unexpected second payment");
        return;
      }
      if (order.collectedMinor)
        throw new ConflictException("Order already has collected funds");
      await m.save(
        Payment,
        m.create(Payment, {
          orderId: order.id,
          amountMinor: order.totalMinor,
          reference: `sslcommerz:${value.bank_tran_id}`,
          evidence: "Verified directly with SSLCommerz validation API",
          actorId: order.userId,
          collectedAt: new Date(),
        }),
      );
      order.collectedMinor = order.totalMinor;
      order.paymentStatus = "paid";
      await m.save(order);
      locked.bankTransactionId = value.bank_tran_id;
      locked.verifiedAt = new Date();
      locked.status =
        String(value.risk_level) === "0" && order.status !== "cancelled"
          ? "paid"
          : "risk";
      await m.save(locked);
      await this.orders.event(
        m,
        order.id,
        order.userId,
        "payment",
        locked.status === "paid"
          ? "Online payment verified"
          : "Online payment held for manual review",
      );
      await this.platform.audit(
        m,
        order.userId,
        "payment.gateway-verified",
        order.id,
        { amountMinor: order.totalMinor, risk: locked.status === "risk" },
      );
    });
  }
  async reconcile(orderId: string, userId?: string) {
    const order = await this.db
      .getRepository(Order)
      .findOneBy({ id: orderId, ...(userId ? { userId } : {}) });
    if (!order) throw new NotFoundException();
    const attempt = await this.db
      .getRepository(GatewayAttempt)
      .findOneBy({ orderId });
    if (!attempt) return { status: "not_started" };
    if (["paid", "risk"].includes(attempt.status))
      return { status: attempt.status };
    const response = await this.provider.query(attempt.transactionId);
    if (response.APIConnect !== "DONE" || !Array.isArray(response.element))
      throw new BadGatewayException("Provider reconciliation unavailable");
    const records = response.element.filter(
      (r: Record<string, unknown>) => r.tran_id === attempt.transactionId,
    );
    const paid = records.find((r: Record<string, unknown>) =>
      ["VALID", "VALIDATED"].includes(String(r.status)),
    );
    if (paid) {
      if (typeof paid.val_id !== "string") throw new BadGatewayException();
      await this.settle(await this.provider.validate(paid.val_id));
    } else if (
      records.length &&
      records.every((r: Record<string, unknown>) =>
        ["FAILED", "CANCELLED", "EXPIRED"].includes(String(r.status)),
      )
    ) {
      await this.db
        .getRepository(GatewayAttempt)
        .createQueryBuilder()
        .update()
        .set({ status: "failed", verifiedAt: new Date() })
        .where("id=:id AND bank_transaction_id IS NULL", { id: attempt.id })
        .execute();
    }
    return {
      status: (
        await this.db
          .getRepository(GatewayAttempt)
          .findOneByOrFail({ id: attempt.id })
      ).status,
    };
  }
  async refund(
    actorId: string,
    orderId: string,
    input: GatewayRefundDto,
    key?: string,
  ) {
    const actor = await this.db
      .getRepository(User)
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.id=:id", { id: actorId })
      .getOneOrFail();
    if (!(await verifyPassword(input.currentPassword, actor.passwordHash)))
      throw new UnauthorizedException("Current password is incorrect");
    const { currentPassword: _, ...command } = input;
    const refund = await this.platform.command(
      `gateway-refund:${actorId}:${orderId}`,
      key,
      command,
      async (m) => {
        const order = await this.orders.locked(
          m,
          orderId,
          input.expectedVersion,
        );
        const attempt = await m.findOneBy(GatewayAttempt, { orderId });
        if (order.paymentMethod !== "sslcommerz" || !attempt?.bankTransactionId)
          throw new ConflictException("A verified online payment is required");
        const pending = await m.findBy(GatewayRefund, {
          orderId,
          status: In(["queued", "submitting", "unknown", "processing"]),
        });
        if (
          input.amountMinor + pending.reduce((n, r) => n + r.amountMinor, 0) >
          order.collectedMinor - order.refundedMinor
        )
          throw new ConflictException("Refund exceeds available funds");
        const created = await m.save(
          GatewayRefund,
          m.create(GatewayRefund, {
            orderId,
            actorId,
            amountMinor: input.amountMinor,
            reason: input.reason,
            transactionId: randomBytes(15).toString("hex"),
          }),
        );
        await this.platform.audit(
          m,
          actorId,
          "refund.gateway-request",
          orderId,
          { amountMinor: input.amountMinor, refundId: created.id },
        );
        return created;
      },
    );
    return this.processRefund(refund.id);
  }
  async processRefund(id: string) {
    let refund = await this.db
      .getRepository(GatewayRefund)
      .findOneByOrFail({ id });
    const attempt = await this.db
      .getRepository(GatewayAttempt)
      .findOneByOrFail({ orderId: refund.orderId });
    if (refund.status === "queued") {
      const claimed = await this.db
        .getRepository(GatewayRefund)
        .update({ id, status: "queued" }, { status: "submitting" });
      if (!claimed.affected) return { status: "submitting", id };
      try {
        const result = await this.provider.refund({
          bank_tran_id: attempt.bankTransactionId!,
          refund_trans_id: refund.transactionId,
          refund_amount: (refund.amountMinor / 100).toFixed(2),
          refund_remarks: refund.reason,
        });
        if (
          result.APIConnect !== "DONE" ||
          result.bank_tran_id !== attempt.bankTransactionId ||
          !["success", "processing"].includes(result.status) ||
          typeof result.refund_ref_id !== "string" ||
          !result.refund_ref_id ||
          result.refund_ref_id.length > 150
        )
          throw new BadGatewayException(
            "Refund initialization needs reconciliation",
          );
        await this.db
          .getRepository(GatewayRefund)
          .update(
            { id },
            { providerReference: result.refund_ref_id, status: "processing" },
          );
      } catch (error) {
        await this.db
          .getRepository(GatewayRefund)
          .update({ id, status: "submitting" }, { status: "unknown" });
        throw error;
      }
      refund = await this.db
        .getRepository(GatewayRefund)
        .findOneByOrFail({ id });
    }
    if (refund.status === "processing" && refund.providerReference) {
      const result = await this.provider.refundStatus(refund.providerReference);
      if (
        result.APIConnect !== "DONE" ||
        result.refund_ref_id !== refund.providerReference ||
        result.bank_tran_id !== attempt.bankTransactionId ||
        result.tran_id !== attempt.transactionId
      )
        throw new BadGatewayException("Refund validation failed");
      if (result.status === "refunded")
        await this.db.transaction(async (m) => {
          const order = await m.findOneOrFail(Order, {
            where: { id: refund.orderId },
            lock: { mode: "pessimistic_write" },
          });
          const locked = await m.findOneOrFail(GatewayRefund, {
            where: { id },
            lock: { mode: "pessimistic_write" },
          });
          if (locked.status === "refunded") return;
          if (order.refundedMinor + locked.amountMinor > order.collectedMinor)
            throw new ConflictException("Refund exceeds collected funds");
          await m.save(
            Refund,
            m.create(Refund, {
              orderId: order.id,
              actorId: locked.actorId,
              amountMinor: locked.amountMinor,
              reference: `sslcommerz:${locked.providerReference}`,
              reason: locked.reason,
            }),
          );
          order.refundedMinor += locked.amountMinor;
          order.paymentStatus =
            order.refundedMinor === order.collectedMinor
              ? "refunded"
              : "partially_refunded";
          await m.save(order);
          locked.status = "refunded";
          await m.save(locked);
          await this.orders.event(
            m,
            order.id,
            locked.actorId,
            "refund",
            "Online refund verified by provider",
          );
        });
      else if (result.status === "cancelled")
        await this.db
          .getRepository(GatewayRefund)
          .update({ id, status: "processing" }, { status: "failed" });
    }
    const current = await this.db
      .getRepository(GatewayRefund)
      .findOneByOrFail({ id });
    return {
      id: current.id,
      status: current.status,
      amountMinor: current.amountMinor,
    };
  }
  private async sweep() {
    if (this.working) return;
    this.working = true;
    try {
      const attempts = await this.db.getRepository(GatewayAttempt).find({
        where: { status: In(["initializing", "pending", "unknown"]) },
        order: { updatedAt: "ASC" },
        take: 10,
      });
      for (const a of attempts)
        try {
          await this.reconcile(a.orderId);
        } catch {
          /* retry on next sweep; no provider data in logs */
        }
      const refunds = await this.db.getRepository(GatewayRefund).find({
        where: { status: In(["queued", "processing"]) },
        order: { updatedAt: "ASC" },
        take: 10,
      });
      for (const r of refunds)
        try {
          await this.processRefund(r.id);
        } catch {
          /* durable unresolved refunds remain reserved */
        }
    } finally {
      this.working = false;
    }
  }
}
