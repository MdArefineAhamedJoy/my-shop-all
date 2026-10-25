import { Check, Column, Entity, Index } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";

export enum Role {
  CUSTOMER = "customer",
  STAFF = "staff",
  ADMIN = "admin",
}

@Entity("users")
@Check(`"role" IN ('customer','staff','admin')`)
@Check("normalized_email", "email = lower(trim(email))")
export class User extends BaseEntity {
  @Index({ unique: true }) @Column({ length: 254 }) email: string;
  @Column({ select: false }) passwordHash: string;
  @Column({ length: 100 }) name: string;
  @Column({ type: "varchar", length: 30, nullable: true }) phone: string | null;
  @Column({ type: "varchar", default: Role.CUSTOMER }) role: Role;
  @Column("text", { array: true, default: "{}" }) permissions: string[];
  @Column({ default: true }) active: boolean;
  @Column({ default: false }) emailVerified: boolean;
  @Column({ type: "text", nullable: true, select: false }) mfaSecret:
    string | null;
  @Column({ type: "bigint", nullable: true, select: false }) mfaLastStep:
    string | null;
}
