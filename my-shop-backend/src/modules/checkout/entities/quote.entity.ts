import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { User } from "../../users/entities/user.entity";
import { AddressSnapshot } from "../../users/entities/address.entity";
import { Promotion } from "../../promotions/entities/promotion.entity";

export interface QuoteLine {
  variantId: string;
  productId: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPriceMinor: number;
}
export interface Totals {
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
}

@Entity("quotes")
@Index(["userId", "createdAt"])
@Index(["expiresAt"])
export class Quote extends BaseEntity {
  @Column("uuid") userId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user: User;
  @Column("jsonb") lines: QuoteLine[];
  @Column("jsonb") totals: Totals;
  @Column("jsonb") shippingAddress: AddressSnapshot;
  @Column({ length: 10, default: "cod" }) paymentMethod: string;
  @Column({ type: "uuid", nullable: true }) promotionId: string | null;
  @ManyToOne(() => Promotion, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({
    name: "promotion_id",
    foreignKeyConstraintName: "quotes_promotion_fk",
  })
  promotion: Promotion | null;
  @Column({ type: "timestamptz" }) expiresAt: Date;
  @Column({ type: "timestamptz", nullable: true }) usedAt: Date | null;
  @Column({ length: 64 }) cartHash: string;
  @Column("integer", { default: 1 }) policyVersion: number;
  @Column({ type: "uuid", nullable: true }) createdById: string | null;
  @ManyToOne(() => User, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({
    name: "created_by_id",
    foreignKeyConstraintName: "quotes_created_by_id_fkey",
  })
  createdBy: User | null;
}
