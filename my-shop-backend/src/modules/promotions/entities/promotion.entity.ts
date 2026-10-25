import { Check, Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";

@Entity("promotions")
@Check(
  '"percent" BETWEEN 1 AND 100 AND "minimum_minor" >= 0 AND "used_count" >= 0 AND "max_uses" > 0 AND "used_count" <= "max_uses"',
)
@Check('"ends_at" > "starts_at"')
export class Promotion extends BaseEntity {
  @Index({ unique: true }) @Column({ length: 40 }) code: string;
  @Column("integer") percent: number;
  @Column("integer", { default: 0 }) minimumMinor: number;
  @Column("integer") maxUses: number;
  @Column("integer", { default: 0 }) usedCount: number;
  @Column({ type: "timestamptz" }) startsAt: Date;
  @Column({ type: "timestamptz" }) endsAt: Date;
  @Column({ default: true }) active: boolean;
}
