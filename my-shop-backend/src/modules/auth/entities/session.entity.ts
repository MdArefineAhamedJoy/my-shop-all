import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { User } from "../../users/entities/user.entity";

@Entity("sessions")
@Index(["userId", "expiresAt"])
@Index("sessions_expiry_idx", ["expiresAt"])
export class Session extends BaseEntity {
  @Column("uuid") userId: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
  @Index({ unique: true }) @Column({ select: false }) refreshDigest: string;
  @Column({ type: "timestamptz" }) expiresAt: Date;
  @Column({ type: "timestamptz", nullable: true }) revokedAt: Date | null;
  @Column({ length: 200 }) device: string;
}

@Entity("auth_tokens")
@Index(["userId", "purpose"])
@Index("tokens_expiry_idx", ["expiresAt"])
export class AuthToken extends BaseEntity {
  @Column("uuid") userId: string;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
  @Index({ unique: true }) @Column({ select: false }) digest: string;
  @Column({ length: 30 }) purpose: "reset" | "verify" | "mfa";
  @Column({ type: "timestamptz" }) expiresAt: Date;
  @Column({ type: "timestamptz", nullable: true }) usedAt: Date | null;
  @Column({ type: "text", nullable: true, select: false }) secret:
    string | null;
}
