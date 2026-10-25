import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { User } from "../../users/entities/user.entity";

@Entity("idempotency_records")
@Index(["scope", "key"], { unique: true })
@Index("idempotency_created_at_idx", ["createdAt"])
export class IdempotencyRecord extends BaseEntity {
  @Column({ length: 200 }) scope: string;
  @Column({ length: 128 }) key: string;
  @Column({ length: 64 }) requestHash: string;
  @Column("jsonb") response: unknown;
}

@Entity("audit_logs")
@Index(["createdAt", "id"])
@Index(["entityId", "createdAt"])
export class AuditLog extends BaseEntity {
  @Column("uuid") actorId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "actor_id",
    foreignKeyConstraintName: "audit_logs_actor_fk",
  })
  actor: User;
  @Column({ length: 100 }) action: string;
  @Column("uuid") entityId: string;
  @Column("jsonb", { default: "{}" }) details: Record<string, unknown>;
}

@Entity("outbox_events")
@Index(["status", "availableAt"])
export class OutboxEvent extends BaseEntity {
  @Column({ length: 40 }) type: string;
  @Column("jsonb", { select: false }) payload: Record<string, unknown>;
  @Column({ length: 20, default: "pending" }) status: string;
  @Column("integer", { default: 0 }) attempts: number;
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  availableAt: Date;
  @Column({ type: "timestamptz", nullable: true }) leaseUntil: Date | null;
  @Column({ type: "varchar", length: 100, nullable: true }) lastError:
    string | null;
}

@Entity("rate_limits")
export class RateLimit {
  @PrimaryColumn({ length: 64 }) key: string;
  @Column("integer") hits: number;
  @Index() @Column({ type: "timestamptz" }) expiresAt: Date;
}
