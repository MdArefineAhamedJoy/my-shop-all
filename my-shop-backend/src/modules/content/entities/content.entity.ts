import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "../../../common/base.entity";
import { User } from "../../users/entities/user.entity";

@Entity("collections")
export class Collection extends BaseEntity {
  @Column({ length: 100 }) name: string;
  @Index({ unique: true }) @Column({ length: 120 }) slug: string;
  @Column("uuid", { array: true, default: "{}" }) productIds: string[];
  @Column({ default: true }) active: boolean;
}

@Entity("storefront_revisions")
@Index("one_published_storefront", ["published"], {
  unique: true,
  where: "published = true",
})
export class StorefrontRevision extends BaseEntity {
  @Column("jsonb") config: Record<string, unknown>;
  @Column("uuid") actorId: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "actor_id",
    foreignKeyConstraintName: "storefront_revisions_actor_fk",
  })
  actor: User;
  @Column({ default: false }) published: boolean;
}

@Entity("newsletter_subscriptions")
export class NewsletterSubscription extends BaseEntity {
  @Index({ unique: true }) @Column({ length: 254 }) email: string;
  @Column({ default: false }) confirmed: boolean;
  @Column({ type: "varchar", nullable: true, select: false }) tokenDigest:
    string | null;
  @Column({ type: "timestamptz", nullable: true }) tokenExpiresAt: Date | null;
  @Column({ length: 100 }) consentRevision: string;
}
