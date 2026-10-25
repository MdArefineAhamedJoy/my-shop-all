import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { Variant } from "../../catalog/entities/catalog.entity";
import { User } from "../../users/entities/user.entity";
import { Order } from "../../orders/entities/order.entity";

@Entity("inventory")
@Check('"available" >= 0')
@Check("inventory_upper_bound", "available <= 10000000")
export class Inventory extends BaseEntity {
  @Index({ unique: true }) @Column("uuid") variantId: string;
  @ManyToOne(() => Variant, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "variant_id" })
  variant: Variant;
  @Column("integer", { default: 0 }) available: number;
}

@Entity("inventory_movements")
@Index(["variantId", "createdAt", "id"])
@Check("movement_nonzero", "quantity <> 0")
export class InventoryMovement extends BaseEntity {
  @Column("uuid") variantId: string;
  @ManyToOne(() => Variant, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "variant_id" })
  variant: Variant;
  @Column("integer") quantity: number;
  @Column({ length: 300 }) reason: string;
  @Column("uuid") actorId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "actor_id",
    foreignKeyConstraintName: "inventory_movements_actor_fk",
  })
  actor: User;
  @Column({ type: "uuid", nullable: true }) orderId: string | null;
  @ManyToOne(() => Order, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({
    name: "order_id",
    foreignKeyConstraintName: "movements_order_fk",
  })
  order: Order;
}
