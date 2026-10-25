import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { Order } from "../../orders/entities/order.entity";
import { User } from "../../users/entities/user.entity";

@Entity("returns")
@Index(["userId", "createdAt", "id"])
@Index(["status", "createdAt", "id"])
@Index("one_open_return_per_order", ["orderId"], {
  unique: true,
  where: `"status" NOT IN ('rejected','closed')`,
})
@Check(
  `"status" IN ('requested','approved','rejected','received','inspected','closed')`,
)
export class ReturnRequest extends BaseEntity {
  @Column("uuid") orderId: string;
  @ManyToOne(() => Order, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "order_id" })
  order: Order;
  @Column("uuid") userId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id", foreignKeyConstraintName: "returns_user_fk" })
  user: User;
  @Column("jsonb") lines: {
    orderLineId: string;
    quantity: number;
    restockQuantity?: number;
  }[];
  @Column({ length: 500 }) reason: string;
  @Column({ length: 20, default: "requested" }) status: string;
  @Column({ type: "text", nullable: true }) staffNote: string | null;
}
