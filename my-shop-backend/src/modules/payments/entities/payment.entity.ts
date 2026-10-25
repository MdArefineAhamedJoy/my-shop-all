import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { Order } from "../../orders/entities/order.entity";
import { User } from "../../users/entities/user.entity";

@Entity("payments")
@Index("payments_collected_at_idx", ["collectedAt"])
@Check('"amount_minor" > 0')
@Index(["orderId", "createdAt"])
export class Payment extends BaseEntity {
  @Column("uuid") orderId: string;
  @ManyToOne(() => Order, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_id" })
  order: Order;
  @Column("integer") amountMinor: number;
  @Index({ unique: true }) @Column({ length: 150 }) reference: string;
  @Column({ length: 500 }) evidence: string;
  @Column("uuid") actorId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "actor_id",
    foreignKeyConstraintName: "payments_actor_fk",
  })
  actor: User;
  @Column({ type: "timestamptz" }) collectedAt: Date;
}

@Entity("refunds")
@Index("refunds_created_at_idx", ["createdAt"])
@Check('"amount_minor" > 0')
@Index(["orderId", "createdAt"])
export class Refund extends BaseEntity {
  @Column("uuid") orderId: string;
  @ManyToOne(() => Order, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_id" })
  order: Order;
  @Column("integer") amountMinor: number;
  @Index({ unique: true }) @Column({ length: 150 }) reference: string;
  @Column({ length: 500 }) reason: string;
  @Column("uuid") actorId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "actor_id",
    foreignKeyConstraintName: "refunds_actor_fk",
  })
  actor: User;
}
