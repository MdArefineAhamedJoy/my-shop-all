import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { User } from "../../users/entities/user.entity";
import { AddressSnapshot } from "../../users/entities/address.entity";
import { Quote, Totals } from "../../checkout/entities/quote.entity";
import { Variant } from "../../catalog/entities/catalog.entity";

@Entity("orders")
@Index(["userId", "createdAt", "id"])
@Index(["status", "createdAt", "id"])
@Index("orders_created_at_idx", ["createdAt"])
@Check(`"status" IN ('pending','processing','shipped','delivered','cancelled')`)
@Check(`"payment_status" IN ('unpaid','paid','partially_refunded','refunded')`)
@Check(
  '"total_minor" > 0 AND "collected_minor" >= 0 AND "refunded_minor" >= 0 AND "refunded_minor" <= "collected_minor" AND "collected_minor" <= "total_minor"',
)
export class Order extends BaseEntity {
  @Index({ unique: true }) @Column({ length: 40 }) orderNumber: string;
  @Column("uuid") userId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user: User;
  @Index({ unique: true }) @Column("uuid") quoteId: string;
  @ManyToOne(() => Quote, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "quote_id" })
  quote: Quote;
  @Column({ length: 20, default: "pending" }) status: string;
  @Column({ length: 30, default: "unpaid" }) paymentStatus: string;
  @Column({ length: 10, default: "cod" }) paymentMethod: string;
  @Column({ length: 3, default: "BDT" }) currency: string;
  @Column("jsonb") totals: Totals;
  @Column("integer") totalMinor: number;
  @Column("integer", { default: 0 }) collectedMinor: number;
  @Column("integer", { default: 0 }) refundedMinor: number;
  @Column("jsonb") shippingAddress: AddressSnapshot;
  @Column({ type: "varchar", length: 100, nullable: true }) courier:
    string | null;
  @Column({ type: "varchar", length: 150, nullable: true }) trackingNumber:
    string | null;
  @Column({ type: "timestamptz", nullable: true }) deliveredAt: Date | null;
  @Column({ type: "text", nullable: true }) cancellationReason: string | null;
}

@Entity("order_lines")
@Check('"quantity" BETWEEN 1 AND 99 AND "unit_price_minor" > 0')
@Index(["orderId", "variantId"], { unique: true })
export class OrderLine extends BaseEntity {
  @Column("uuid") orderId: string;
  @ManyToOne(() => Order, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_id" })
  order: Order;
  @Column("uuid") variantId: string;
  @ManyToOne(() => Variant, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "variant_id" })
  variant: Variant;
  @Column({ length: 200 }) name: string;
  @Column({ length: 80 }) sku: string;
  @Column({ length: 30 }) size: string;
  @Column({ length: 50 }) color: string;
  @Column("integer") quantity: number;
  @Column("integer") unitPriceMinor: number;
}

@Entity("order_events")
@Index(["orderId", "createdAt", "id"])
export class OrderEvent extends BaseEntity {
  @Column("uuid") orderId: string;
  @ManyToOne(() => Order, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_id" })
  order: Order;
  @Column("uuid") actorId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "actor_id",
    foreignKeyConstraintName: "order_events_actor_fk",
  })
  actor: User;
  @Column({ length: 50 }) type: string;
  @Column({ length: 500 }) message: string;
}
