import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource, In } from "typeorm";
import { randomBytes } from "node:crypto";
import {
  Collection,
  NewsletterSubscription,
  StorefrontRevision,
} from "./entities/content.entity";
import { CollectionDto, NewsletterDto, StorefrontDto } from "./dto/content.dto";
import { PlatformService } from "../platform/platform.service";
import { Product } from "../catalog/entities/catalog.entity";
import { digest } from "../../common/api";
import { encrypt } from "../auth/crypto";

@Injectable()
export class ContentService {
  constructor(
    private db: DataSource,
    private platform: PlatformService,
    private config: ConfigService,
  ) {}
  async storefront() {
    const row = await this.db.getRepository(StorefrontRevision).findOne({
      where: { published: true },
      order: { createdAt: "DESC", id: "DESC" },
    });
    return row
      ? { revisionId: row.id, ...row.config }
      : { storeName: "MyShop", banners: [], announcement: "" };
  }
  revisions() {
    return this.db
      .getRepository(StorefrontRevision)
      .find({ order: { createdAt: "DESC" }, take: 20 });
  }
  async draft(actorId: string, input: StorefrontDto) {
    return this.db.transaction(async (m) => {
      const row = await m.save(
        StorefrontRevision,
        m.create(StorefrontRevision, {
          actorId,
          config: JSON.parse(JSON.stringify(input)),
        }),
      );
      await this.platform.audit(m, actorId, "storefront.draft", row.id);
      return row;
    });
  }
  async publish(actorId: string, id: string, expectedVersion: number) {
    return this.db.transaction(async (m) => {
      await m.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('storefront',0))",
      );
      const row = await m.findOneBy(StorefrontRevision, { id });
      if (!row) throw new NotFoundException();
      if (row.version !== expectedVersion || row.published)
        throw new ConflictException(
          "Revision already published or VERSION_CONFLICT",
        );
      await m.update(
        StorefrontRevision,
        { published: true },
        { published: false },
      );
      row.published = true;
      await this.platform.audit(m, actorId, "storefront.publish", id);
      return m.save(row);
    });
  }
  collections(admin = false) {
    return this.db.getRepository(Collection).find({
      where: admin ? {} : { active: true },
      order: { createdAt: "DESC" },
      take: 100,
    });
  }
  async collection(
    actorId: string,
    input: CollectionDto,
    id?: string,
    version?: number,
  ) {
    return this.db.transaction(async (m) => {
      if (
        input.productIds.length &&
        (await m.countBy(Product, { id: In(input.productIds) })) !==
          input.productIds.length
      )
        throw new BadRequestException("Collection contains missing products");
      let row = id
        ? await m.findOne(Collection, {
            where: { id },
            lock: { mode: "pessimistic_write" },
          })
        : null;
      if (id && !row) throw new NotFoundException();
      if (row && row.version !== version)
        throw new ConflictException("VERSION_CONFLICT");
      row = await m.save(
        Collection,
        m.create(Collection, { ...(row || {}), ...input }),
      );
      await this.platform.audit(m, actorId, "collection.save", row.id);
      return row;
    });
  }
  async subscribe(input: NewsletterDto) {
    await this.db.transaction(async (m) => {
      await m.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
        `newsletter:${input.email}`,
      ]);
      const row = await m.findOneBy(NewsletterSubscription, {
        email: input.email,
      });
      if (
        row?.confirmed ||
        (row?.tokenExpiresAt &&
          row.tokenExpiresAt.getTime() > Date.now() + 23 * 3600000)
      )
        return;
      const token = randomBytes(48).toString("base64url");
      await m.save(
        NewsletterSubscription,
        m.create(NewsletterSubscription, {
          ...(row || {}),
          email: input.email,
          consentRevision: input.consentRevision,
          tokenDigest: digest(token),
          tokenExpiresAt: new Date(Date.now() + 86400000),
        }),
      );
      await this.platform.enqueue(m, "email", {
        to: input.email,
        subject: "Confirm your MyShop newsletter subscription",
        encryptedText: encrypt(
          `Confirm your subscription within 24 hours: ${this.config.get<string>("STOREFRONT_URL") || "http://localhost:3000"}/confirm?purpose=newsletter&token=${token}`,
          this.config.getOrThrow("APP_ENCRYPTION_KEY"),
        ),
      });
    });
    return { message: "Check your email to confirm your subscription." };
  }
  async confirm(token: string) {
    return this.db.transaction(async (m) => {
      const row = await m
        .getRepository(NewsletterSubscription)
        .createQueryBuilder("n")
        .where("n.tokenDigest = :digest AND n.tokenExpiresAt > now()", {
          digest: digest(token),
        })
        .setLock("pessimistic_write")
        .getOne();
      if (!row) throw new BadRequestException("Token is invalid or expired");
      const unsubscribe = randomBytes(48).toString("base64url");
      row.confirmed = true;
      row.tokenDigest = digest(unsubscribe);
      row.tokenExpiresAt = null;
      await m.save(row);
      await this.platform.enqueue(m, "email", {
        to: row.email,
        subject: "MyShop newsletter subscription confirmed",
        encryptedText: encrypt(
          `Unsubscribe: ${this.config.get<string>("STOREFRONT_URL") || "http://localhost:3000"}/confirm?purpose=unsubscribe&token=${unsubscribe}`,
          this.config.getOrThrow("APP_ENCRYPTION_KEY"),
        ),
      });
      return { confirmed: true };
    });
  }
  async unsubscribe(token: string) {
    await this.db
      .getRepository(NewsletterSubscription)
      .createQueryBuilder()
      .update()
      .set({ confirmed: false, tokenDigest: null })
      .where("token_digest = :digest AND confirmed = true", {
        digest: digest(token),
      })
      .execute();
    return { unsubscribed: true };
  }
}
