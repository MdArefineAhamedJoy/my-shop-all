import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { User } from "./user.entity";

export interface AddressSnapshot {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
}
@Entity("addresses")
@Index(["userId", "createdAt", "id"])
@Index("one_default_address_per_user", ["userId"], {
  unique: true,
  where: "is_default = true",
})
export class Address extends BaseEntity {
  @Column("uuid") userId: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
  @Column({ length: 50 }) label: string;
  @Column("jsonb") details: AddressSnapshot;
  @Column({ default: false }) isDefault: boolean;
}
