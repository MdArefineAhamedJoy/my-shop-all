import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";

@Entity("categories")
export class Category extends BaseEntity {
  @Column({ length: 100 }) name: string;
  @Index({ unique: true }) @Column({ length: 120 }) slug: string;
  @Column({ default: true }) active: boolean;
  @Column({ default: 0 }) sortOrder: number;
}

@Entity("products")
@Check(`"status" IN ('draft','published','archived')`)
@Check(`"gender" IN ('men','women','unisex')`)
@Index(["status", "createdAt", "id"])
@Index(["categoryId", "status", "createdAt", "id"])
@Index("products_search_idx", { synchronize: false })
@Index("products_tags_idx", { synchronize: false })
export class Product extends BaseEntity {
  @Column({ length: 200 }) name: string;
  @Index({ unique: true }) @Column({ length: 220 }) slug: string;
  @Column("text") description: string;
  @Column("uuid") categoryId: string;
  @ManyToOne(() => Category, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" })
  category: Category;
  @Column({ length: 10, default: "unisex" }) gender: string;
  @Column({ length: 20, default: "draft" }) status:
    "draft" | "published" | "archived";
  @Column("text", { array: true, default: "{}" }) images: string[];
  @Column("text", { array: true, default: "{}" }) tags: string[];
  @Column({ default: false }) isFeatured: boolean;
  @Column({ default: false }) isNew: boolean;
  @Column({ type: "timestamptz", nullable: true }) publishedAt: Date | null;
}

@Entity("variants")
@Check('"price_minor" > 0 AND "price_minor" <= 100000000')
@Check('"compare_at_minor" IS NULL OR "compare_at_minor" >= "price_minor"')
@Index(["productId", "size", "color"], { unique: true })
@Index(["productId", "active", "priceMinor"])
export class Variant extends BaseEntity {
  @Column("uuid") productId: string;
  @ManyToOne(() => Product, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "product_id" })
  product: Product;
  @Index({ unique: true }) @Column({ length: 80 }) sku: string;
  @Column({ length: 30 }) size: string;
  @Column({ length: 50 }) color: string;
  @Column("integer") priceMinor: number;
  @Column({ type: "integer", nullable: true }) compareAtMinor: number | null;
  @Column({ default: true }) active: boolean;
}
