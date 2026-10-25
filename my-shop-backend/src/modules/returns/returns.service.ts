import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Order, OrderLine } from "../orders/entities/order.entity";
import { ReturnRequest } from "./entities/return.entity";
import {
  CreateReturnDto,
  InspectReturnDto,
  ReviewReturnDto,
} from "./dto/return.dto";
import { PlatformService } from "../platform/platform.service";
import {
  Inventory,
  InventoryMovement,
} from "../inventory/entities/inventory.entity";
import { PageQuery, paginate } from "../../common/api";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class ReturnsService {
  constructor(
    private db: DataSource,
    private settings: SettingsService,
    private platform: PlatformService,
  ) {}
  create(
    userId: string,
    orderId: string,
    input: CreateReturnDto,
    key?: string,
  ) {
    return this.platform.command(
      `return:${userId}:${orderId}`,
      key,
      input,
      async (m) => {
        const order = await m.findOne(Order, {
          where: { id: orderId, userId },
          lock: { mode: "pessimistic_write" },
        });
        if (!order) throw new NotFoundException();
        const policy = await this.settings.get(m);
        if (
          order.status !== "delivered" ||
          !order.deliveredAt ||
          Date.now() - order.deliveredAt.getTime() >
            policy.returnWindowDays * 86400000
        )
          throw new ConflictException("Order is outside the return window");
        if (order.collectedMinor !== order.totalMinor)
          throw new ConflictException(
            "Reconcile the full COD collection before opening a return",
          );
        const lines = await m.findBy(OrderLine, { orderId });
        const previous = await m.findBy(ReturnRequest, { orderId });
        if (previous.some((r) => !["closed", "rejected"].includes(r.status)))
          throw new ConflictException("An open return already exists");
        for (const line of input.lines) {
          const original = lines.find((l) => l.id === line.orderLineId);
          const returned = previous
            .filter((r) => r.status === "closed")
            .flatMap((r) => r.lines)
            .filter((l) => l.orderLineId === line.orderLineId)
            .reduce((s, l) => s + l.quantity, 0);
          if (!original || line.quantity + returned > original.quantity)
            throw new ConflictException(
              "Return quantity exceeds purchased quantity",
            );
        }
        const row = await m.save(
          ReturnRequest,
          m.create(ReturnRequest, { userId, orderId, ...input }),
        );
        await this.platform.audit(m, userId, "return.request", row.id);
        return row;
      },
    );
  }
  list(query: PageQuery) {
    return paginate(
      this.db.getRepository(ReturnRequest).createQueryBuilder("r"),
      query,
      "returns",
    );
  }
  async detail(id: string, userId?: string) {
    const row = await this.db
      .getRepository(ReturnRequest)
      .findOneBy({ id, ...(userId ? { userId } : {}) });
    if (!row) throw new NotFoundException();
    return row;
  }
  review(
    actorId: string,
    id: string,
    action: "approve" | "reject" | "receive" | "inspect" | "close",
    input: ReviewReturnDto | InspectReturnDto,
    key?: string,
  ) {
    return this.platform.command(
      `return-${action}:${actorId}:${id}`,
      key,
      input,
      async (m) => {
        const row = await m.findOne(ReturnRequest, {
          where: { id },
          lock: { mode: "pessimistic_write" },
        });
        if (!row) throw new NotFoundException();
        if (row.version !== input.expectedVersion)
          throw new ConflictException("VERSION_CONFLICT");
        const transitions = {
          approve: ["requested", "approved"],
          reject: ["requested", "rejected"],
          receive: ["approved", "received"],
          inspect: ["received", "inspected"],
          close: ["inspected", "closed"],
        };
        const [from, to] = transitions[action];
        if (row.status !== from)
          throw new ConflictException(`Return must be ${from}`);
        if (action === "inspect") {
          const inspection = input as InspectReturnDto;
          if (inspection.lines.length !== row.lines.length)
            throw new ConflictException("Inspect every returned line");
          const originals = await m.find(OrderLine, {
            where: { orderId: row.orderId },
            order: { variantId: "ASC" },
          });
          for (const original of originals) {
            const returned = row.lines.find(
              (l) => l.orderLineId === original.id,
            );
            if (!returned) continue;
            const decision = inspection.lines.find(
              (l) => l.orderLineId === original.id,
            );
            if (!decision || decision.restockQuantity > returned.quantity)
              throw new ConflictException("Invalid restock quantity");
            returned.restockQuantity = decision.restockQuantity;
            if (decision.restockQuantity) {
              await m.increment(
                Inventory,
                { variantId: original.variantId },
                "available",
                decision.restockQuantity,
              );
              await m.save(
                InventoryMovement,
                m.create(InventoryMovement, {
                  variantId: original.variantId,
                  quantity: decision.restockQuantity,
                  actorId,
                  orderId: row.orderId,
                  reason: `Return inspected: ${id}`,
                }),
              );
            }
          }
        }
        if (action === "close") {
          const order = await m.findOne(Order, {
            where: { id: row.orderId },
            lock: { mode: "pessimistic_write" },
          });
          if (!order) throw new NotFoundException();
          const originals = await m.findBy(OrderLine, { orderId: row.orderId });
          const allReturns = await m.findBy(ReturnRequest, {
            orderId: row.orderId,
          });
          const returnSubtotal = [
            ...allReturns.filter((r) => r.status === "closed"),
            row,
          ]
            .flatMap((r) => r.lines)
            .reduce(
              (sum, line) =>
                sum +
                (originals.find((l) => l.id === line.orderLineId)
                  ?.unitPriceMinor || 0) *
                  line.quantity,
              0,
            );
          // Discount/tax prorated cumulatively; delivery charges are excluded.
          const requiredRefund = Math.min(
            order.collectedMinor,
            Math.floor(
              (returnSubtotal *
                (order.totals.subtotalMinor -
                  order.totals.discountMinor +
                  order.totals.taxMinor)) /
                order.totals.subtotalMinor,
            ),
          );
          if (order.refundedMinor < requiredRefund)
            throw new ConflictException(
              `Record at least ${requiredRefund} minor units of total refunds before closing`,
            );
        }
        row.status = to;
        row.staffNote = input.note;
        await this.platform.audit(m, actorId, `return.${action}`, id, {
          note: input.note,
        });
        return m.save(row);
      },
    );
  }
}
