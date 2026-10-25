import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { User } from "../../users/entities/user.entity";
import { Variant, Product } from "../../catalog/entities/catalog.entity";

@Entity("cart_items")
@Check('"quantity" BETWEEN 1 AND 99')
@Index(["userId", "variantId"], { unique: true })
export class CartItem extends BaseEntity {
  @Column("uuid") userId: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
  @Column("uuid") variantId: string;
  @ManyToOne(() => Variant, { onDelete: "CASCADE" })
  @JoinColumn({ name: "variant_id" })
  variant: Variant;
  @Column("integer") quantity: number;
}

@Entity("wishlist_items")
@Index(["userId", "productId"], { unique: true })
@Index(["userId", "createdAt", "id"])
export class WishlistItem extends BaseEntity {
  @Column("uuid") userId: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
  @Column("uuid") productId: string;
  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: Product;
}
