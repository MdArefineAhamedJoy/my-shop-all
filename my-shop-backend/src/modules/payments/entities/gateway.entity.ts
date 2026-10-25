import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { Order } from "../../orders/entities/order.entity";
import { User } from "../../users/entities/user.entity";

@Entity("gateway_attempts")
@Check(
  "gateway_attempt_status_check",
  `"status" IN ('initializing','pending','unknown','paid','risk','failed')`,
)
@Index(["status", "updatedAt"])
export class GatewayAttempt extends BaseEntity {
  @Index({ unique: true }) @Column("uuid") orderId: string;
  @ManyToOne(() => Order, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_id" })
  order: Order;
  @Index({ unique: true }) @Column({ length: 30 }) transactionId: string;
  @Column({ length: 30, default: "initializing" }) status: string;
  @Column({ type: "text", nullable: true, select: false }) checkoutUrl:
    string | null;
  @Column({ type: "varchar", length: 150, nullable: true }) bankTransactionId:
    string | null;
  @Column({ type: "timestamptz", nullable: true }) verifiedAt: Date | null;
}

@Entity("gateway_refunds")
@Check("gateway_refund_amount_check", '"amount_minor" > 0')
@Check(
  "gateway_refund_status_check",
  `"status" IN ('queued','submitting','unknown','processing','refunded','failed')`,
)
@Index(["status", "updatedAt"])
export class GatewayRefund extends BaseEntity {
  @Column("uuid") orderId: string;
  @ManyToOne(() => Order, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_id" })
  order: Order;
  @Column("uuid") actorId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "actor_id" })
  actor: User;
  @Index({ unique: true }) @Column({ length: 30 }) transactionId: string;
  @Column("integer") amountMinor: number;
  @Column({ length: 255 }) reason: string;
  @Column({ length: 30, default: "queued" }) status: string;
  @Column({ type: "varchar", length: 150, nullable: true }) providerReference:
    string | null;
}
