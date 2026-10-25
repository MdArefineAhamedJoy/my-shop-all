import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { OrdersService } from "../orders/orders.service";
import { PlatformService } from "../platform/platform.service";
import { Payment, Refund } from "./entities/payment.entity";
import { CodCollectionDto, RefundDto } from "./dto/payment.dto";
import { PageQuery, paginate } from "../../common/api";
import { User } from "../users/entities/user.entity";
import { verifyPassword } from "../auth/crypto";

@Injectable()
export class PaymentsService {
  constructor(
    private db: DataSource,
    private orders: OrdersService,
    private platform: PlatformService,
  ) {}
  payments(query: PageQuery) {
    return paginate(
      this.db.getRepository(Payment).createQueryBuilder("p"),
      query,
      "payments",
    );
  }
  refunds(query: PageQuery) {
    return paginate(
      this.db.getRepository(Refund).createQueryBuilder("r"),
      query,
      "refunds",
    );
  }
  collect(actorId: string, id: string, input: CodCollectionDto, key?: string) {
    return this.platform.command(
      `collect:${actorId}:${id}`,
      key,
      input,
      async (m) => {
        const order = await this.orders.locked(m, id, input.expectedVersion);
        if (order.status !== "delivered" || order.paymentMethod !== "cod")
          throw new ConflictException(
            "COD collection requires a delivered COD order",
          );
        if (
          order.refundedMinor ||
          order.collectedMinor + input.amountMinor > order.totalMinor
        )
          throw new ConflictException(
            "Collection exceeds the outstanding balance or order was refunded",
          );
        if (Date.parse(input.collectedAt) > Date.now() + 60000)
          throw new BadRequestException(
            "Collection date cannot be in the future",
          );
        const payment = await m.save(
          Payment,
          m.create(Payment, {
            orderId: id,
            amountMinor: input.amountMinor,
            reference: input.reference,
            evidence: input.evidence,
            actorId,
            collectedAt: new Date(input.collectedAt),
          }),
        );
        order.collectedMinor += input.amountMinor;
        if (order.collectedMinor === order.totalMinor)
          order.paymentStatus = "paid";
        await m.save(order);
        await this.orders.event(
          m,
          id,
          actorId,
          "payment",
          "COD collection recorded",
        );
        await this.platform.audit(m, actorId, "payment.collect", id, {
          amountMinor: input.amountMinor,
          reference: input.reference,
        });
        return {
          payment,
          orderVersion: order.version,
          paymentStatus: order.paymentStatus,
        };
      },
    );
  }
  async refund(actorId: string, id: string, input: RefundDto, key?: string) {
    const actor = await this.db
      .getRepository(User)
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.id = :id", { id: actorId })
      .getOneOrFail();
    if (!(await verifyPassword(input.currentPassword, actor.passwordHash)))
      throw new UnauthorizedException("Current password is incorrect");
    const { currentPassword: _password, ...command } = input;
    return this.platform.command(
      `refund:${actorId}:${id}`,
      key,
      command,
      async (m) => {
        const order = await this.orders.locked(m, id, input.expectedVersion);
        if (order.collectedMinor - order.refundedMinor < input.amountMinor)
          throw new ConflictException("Refund exceeds collected funds");
        if (order.paymentMethod !== "cod")
          throw new ConflictException(
            "Use the verified online refund endpoint for online payments",
          );
        const refund = await m.save(
          Refund,
          m.create(Refund, {
            orderId: id,
            actorId,
            amountMinor: input.amountMinor,
            reference: input.reference,
            reason: input.reason,
          }),
        );
        order.refundedMinor += input.amountMinor;
        order.paymentStatus =
          order.refundedMinor === order.collectedMinor
            ? "refunded"
            : "partially_refunded";
        await m.save(order);
        await this.orders.event(m, id, actorId, "refund", "Refund recorded");
        await this.platform.audit(m, actorId, "refund.record", id, {
          amountMinor: input.amountMinor,
          reference: input.reference,
        });
        return {
          refund,
          orderVersion: order.version,
          paymentStatus: order.paymentStatus,
        };
      },
    );
  }
}
