import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1792853905068 implements MigrationInterface {
  name = "InitialSchema1792853905068";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "email" character varying(254) NOT NULL, "password_hash" character varying NOT NULL, "name" character varying(100) NOT NULL, "phone" character varying(30), "role" character varying NOT NULL DEFAULT 'customer', "permissions" text array NOT NULL DEFAULT '{}', "active" boolean NOT NULL DEFAULT true, "email_verified" boolean NOT NULL DEFAULT false, "mfa_secret" text, "mfa_last_step" bigint, CONSTRAINT "CHK_75088beac98fba35cf819163c9" CHECK ("role" IN ('customer','staff','admin')), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "user_id" uuid NOT NULL, "label" character varying(50) NOT NULL, "details" jsonb NOT NULL, "is_default" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f5f74c0fce666f2fdf8c804523" ON "addresses" ("user_id", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "user_id" uuid NOT NULL, "refresh_digest" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "device" character varying(200) NOT NULL, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c6580f0551c8b0855ec4d82e55" ON "sessions" ("refresh_digest") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a98be8e57a5749c1d8e41edced" ON "sessions" ("user_id", "expires_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "user_id" uuid NOT NULL, "digest" character varying NOT NULL, "purpose" character varying(30) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "secret" text, CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9e13e410411229ff0bed128e3c" ON "auth_tokens" ("digest") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8291a56d41c8e1b6e6b536c9af" ON "auth_tokens" ("user_id", "purpose") `,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(120) NOT NULL, "active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_420d9f679d41281f282f5bc7d0" ON "categories" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "name" character varying(200) NOT NULL, "slug" character varying(220) NOT NULL, "description" text NOT NULL, "category_id" uuid NOT NULL, "gender" character varying(10) NOT NULL DEFAULT 'unisex', "status" character varying(20) NOT NULL DEFAULT 'draft', "images" text array NOT NULL DEFAULT '{}', "tags" text array NOT NULL DEFAULT '{}', "is_featured" boolean NOT NULL DEFAULT false, "is_new" boolean NOT NULL DEFAULT false, "published_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_55b277a4826069314ae1b174ab" CHECK ("gender" IN ('men','women','unisex')), CONSTRAINT "CHK_ecc9fd6f34632c4a23dcf6f7cd" CHECK ("status" IN ('draft','published','archived')), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_464f927ae360106b783ed0b410" ON "products" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1801be3853387931ec035a342e" ON "products" ("category_id", "status", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_19ba10fab3217c08913f43357a" ON "products" ("status", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "product_id" uuid NOT NULL, "sku" character varying(80) NOT NULL, "size" character varying(30) NOT NULL, "color" character varying(50) NOT NULL, "price_minor" integer NOT NULL, "compare_at_minor" integer, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "CHK_b1640f58cdf909b082826dd7ef" CHECK ("compare_at_minor" IS NULL OR "compare_at_minor" >= "price_minor"), CONSTRAINT "CHK_8063ffb747917356d47d64a2da" CHECK ("price_minor" > 0 AND "price_minor" <= 100000000), CONSTRAINT "PK_672d13d1a6de0197f20c6babb5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_36c4c7a3b994abc268f8ebbf48" ON "variants" ("sku") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f62b56dd4fb5977b77dc52497" ON "variants" ("product_id", "active", "price_minor") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9df3dfe3b422bc91678a42c694" ON "variants" ("product_id", "size", "color") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "variant_id" uuid NOT NULL, "available" integer NOT NULL DEFAULT '0', CONSTRAINT "CHK_48b6ef9d163fdff92cfb13e139" CHECK ("available" >= 0), CONSTRAINT "PK_82aa5da437c5bbfb80703b08309" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ceba910e3505fc54c3c7f92c94" ON "inventory" ("variant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "variant_id" uuid NOT NULL, "quantity" integer NOT NULL, "reason" character varying(300) NOT NULL, "actor_id" uuid NOT NULL, "order_id" uuid, CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4cc786ce63bdeb9c0dca52fc2" ON "inventory_movements" ("variant_id", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "cart_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "user_id" uuid NOT NULL, "variant_id" uuid NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "CHK_370ab62bb2f16b622bb7267d1c" CHECK ("quantity" BETWEEN 1 AND 99), CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f345c6d477fb6ac3a7976a1583" ON "cart_items" ("user_id", "variant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "wishlist_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "user_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "PK_0bd52924a97cda208ed2a07bd69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a4d65e8b82289ad2346c90a3a6" ON "wishlist_items" ("user_id", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e0584a3664156caa678765afad" ON "wishlist_items" ("user_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "user_id" uuid NOT NULL, "lines" jsonb NOT NULL, "totals" jsonb NOT NULL, "shipping_address" jsonb NOT NULL, "payment_method" character varying(10) NOT NULL DEFAULT 'cod', "promotion_id" uuid, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "cart_hash" character varying(64) NOT NULL, CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_426739267087f74fe174584dfe" ON "quotes" ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80d7245bdbefed8e0c8a8fa267" ON "quotes" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "order_number" character varying(40) NOT NULL, "user_id" uuid NOT NULL, "quote_id" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "payment_status" character varying(30) NOT NULL DEFAULT 'unpaid', "payment_method" character varying(10) NOT NULL DEFAULT 'cod', "currency" character varying(3) NOT NULL DEFAULT 'BDT', "totals" jsonb NOT NULL, "total_minor" integer NOT NULL, "collected_minor" integer NOT NULL DEFAULT '0', "refunded_minor" integer NOT NULL DEFAULT '0', "shipping_address" jsonb NOT NULL, "courier" character varying(100), "tracking_number" character varying(150), "delivered_at" TIMESTAMP WITH TIME ZONE, "cancellation_reason" text, CONSTRAINT "CHK_84a57de43ebeca8d1957ea0206" CHECK ("total_minor" > 0 AND "collected_minor" >= 0 AND "refunded_minor" >= 0 AND "refunded_minor" <= "collected_minor" AND "collected_minor" <= "total_minor"), CONSTRAINT "CHK_01fe3c2b5d4aea9d86a31763cd" CHECK ("payment_status" IN ('unpaid','paid','partially_refunded','refunded')), CONSTRAINT "CHK_068d62bd87d7753b210aa96c86" CHECK ("status" IN ('pending','processing','shipped','delivered','cancelled')), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_75eba1c6b1a66b09f2a97e6927" ON "orders" ("order_number") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d6183642a34a405848c4926c11" ON "orders" ("quote_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d49ebb88dbe89528bdd5e80cb" ON "orders" ("status", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f86975012dff03927c8790b4e5" ON "orders" ("user_id", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "order_id" uuid NOT NULL, "variant_id" uuid NOT NULL, "name" character varying(200) NOT NULL, "sku" character varying(80) NOT NULL, "size" character varying(30) NOT NULL, "color" character varying(50) NOT NULL, "quantity" integer NOT NULL, "unit_price_minor" integer NOT NULL, CONSTRAINT "CHK_1329dd2eee384eba7dec119b59" CHECK ("quantity" BETWEEN 1 AND 99 AND "unit_price_minor" > 0), CONSTRAINT "PK_627dcd7f1d707de4df241b2da6b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2c4f3f1c3f64b13d56fc5e93cd" ON "order_lines" ("order_id", "variant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "order_id" uuid NOT NULL, "actor_id" uuid NOT NULL, "type" character varying(50) NOT NULL, "message" character varying(500) NOT NULL, CONSTRAINT "PK_cc1b82b0fcf1be577d9d7ecbf8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f8928c02446e7818e6db5b2bce" ON "order_events" ("order_id", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "order_id" uuid NOT NULL, "amount_minor" integer NOT NULL, "reference" character varying(150) NOT NULL, "evidence" character varying(500) NOT NULL, "actor_id" uuid NOT NULL, "collected_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "CHK_b8f116e529193770b4ddce866d" CHECK ("amount_minor" > 0), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_866ddee0e17d9385b4e3b86851" ON "payments" ("reference") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9a7d9567320bc4fa02ef9b0bf" ON "payments" ("order_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refunds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "order_id" uuid NOT NULL, "amount_minor" integer NOT NULL, "reference" character varying(150) NOT NULL, "reason" character varying(500) NOT NULL, "actor_id" uuid NOT NULL, CONSTRAINT "CHK_fa811aaab458e6a1bc9003d020" CHECK ("amount_minor" > 0), CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_722ff4a1db27817dbe5facce71" ON "refunds" ("reference") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_55dcf88525a9b0a64d8445f827" ON "refunds" ("order_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "promotions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "code" character varying(40) NOT NULL, "percent" integer NOT NULL, "minimum_minor" integer NOT NULL DEFAULT '0', "max_uses" integer NOT NULL, "used_count" integer NOT NULL DEFAULT '0', "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "CHK_32093e527cce2ff9ad5abc3b0d" CHECK ("ends_at" > "starts_at"), CONSTRAINT "CHK_e8d6a91f872157ddb2969005bc" CHECK ("percent" BETWEEN 1 AND 100 AND "minimum_minor" >= 0 AND "used_count" >= 0 AND "max_uses" > 0 AND "used_count" <= "max_uses"), CONSTRAINT "PK_380cecbbe3ac11f0e5a7c452c34" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8ab10e580f70c3d2e2e4b31ebf" ON "promotions" ("code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "returns" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "order_id" uuid NOT NULL, "user_id" uuid NOT NULL, "lines" jsonb NOT NULL, "reason" character varying(500) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'requested', "staff_note" text, CONSTRAINT "CHK_6f5d5128a82f12ce10711f8867" CHECK ("status" IN ('requested','approved','rejected','received','inspected','closed')), CONSTRAINT "PK_27a2f1895a71519ebfec7850361" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "one_open_return_per_order" ON "returns" ("order_id") WHERE "status" NOT IN ('rejected','closed')`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3b6bec4c54f201209558b9e3e" ON "returns" ("status", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4eefccf0f57508114a1f950b4a" ON "returns" ("user_id", "created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "idempotency_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "scope" character varying(200) NOT NULL, "key" character varying(128) NOT NULL, "request_hash" character varying(64) NOT NULL, "response" jsonb NOT NULL, CONSTRAINT "PK_9ae4e93699362b0d4e3da3dd1c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9c03b6adebf385ca991d085063" ON "idempotency_records" ("scope", "key") `,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "actor_id" uuid NOT NULL, "action" character varying(100) NOT NULL, "entity_id" uuid NOT NULL, "details" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec5508637d45272e4217ed9a91" ON "audit_logs" ("entity_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6498a43d96b79fb3e6091d4fcb" ON "audit_logs" ("created_at", "id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "outbox_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "type" character varying(40) NOT NULL, "payload" jsonb NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT '0', "available_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lease_until" TIMESTAMP WITH TIME ZONE, "last_error" character varying(100), CONSTRAINT "PK_6689a16c00d09b8089f6237f1d2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6386ea4d00463337e4d9e50305" ON "outbox_events" ("status", "available_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rate_limits" ("key" character varying(64) NOT NULL, "hits" integer NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_8cb6aa4831e3e775ccf370521db" PRIMARY KEY ("key"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0868de1b0aa2a8a3207ca37f0" ON "rate_limits" ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "collections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(120) NOT NULL, "product_ids" uuid array NOT NULL DEFAULT '{}', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_21c00b1ebbd41ba1354242c5c4e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_99d0d14f9f23b45d2c6648c4b5" ON "collections" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "storefront_revisions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "config" jsonb NOT NULL, "actor_id" uuid NOT NULL, "published" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_41bb1d0e9a736c6dc7f99909091" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "newsletter_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "email" character varying(254) NOT NULL, "confirmed" boolean NOT NULL DEFAULT false, "token_digest" character varying, "token_expires_at" TIMESTAMP WITH TIME ZONE, "consent_revision" character varying(100) NOT NULL, CONSTRAINT "PK_cfca9a6e4f146a80a6cd2e76f1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_57fd53bd8b39fe19d2be8136f6" ON "newsletter_subscriptions" ("email") `,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_9691367d446cd8b18f462c191b3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "variants" ADD CONSTRAINT "FK_a9625f5484e6b6941d401ec101c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "FK_ceba910e3505fc54c3c7f92c943" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_1bb851d7c7ef2435fad91cae453" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_b7213c20c1ecdc6597abc8f1212" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_549f44d8b756e2690deb099f83b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_177397e044732e7e9c0215cd5b7" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes" ADD CONSTRAINT "FK_adc561cc8195c80ec2eee9cee47" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_d6183642a34a405848c4926c116" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_lines" ADD CONSTRAINT "FK_6a619803439ea92778cafc8fb54" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_lines" ADD CONSTRAINT "FK_f7e61d04cb1799446fb31bc9306" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_events" ADD CONSTRAINT "FK_b33cbf9a59cbee112d94bcb59de" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_a42db6369017df60549539f5567" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "returns" ADD CONSTRAINT "FK_7c0b171a97595625487728ddb3e" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "returns" DROP CONSTRAINT "FK_7c0b171a97595625487728ddb3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_a42db6369017df60549539f5567"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_events" DROP CONSTRAINT "FK_b33cbf9a59cbee112d94bcb59de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_lines" DROP CONSTRAINT "FK_f7e61d04cb1799446fb31bc9306"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_lines" DROP CONSTRAINT "FK_6a619803439ea92778cafc8fb54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_d6183642a34a405848c4926c116"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes" DROP CONSTRAINT "FK_adc561cc8195c80ec2eee9cee47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_177397e044732e7e9c0215cd5b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_549f44d8b756e2690deb099f83b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ede780fc2b865d1d1323e598038"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_b7213c20c1ecdc6597abc8f1212"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_1bb851d7c7ef2435fad91cae453"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT "FK_ceba910e3505fc54c3c7f92c943"`,
    );
    await queryRunner.query(
      `ALTER TABLE "variants" DROP CONSTRAINT "FK_a9625f5484e6b6941d401ec101c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_9691367d446cd8b18f462c191b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" DROP CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57fd53bd8b39fe19d2be8136f6"`,
    );
    await queryRunner.query(`DROP TABLE "newsletter_subscriptions"`);
    await queryRunner.query(`DROP TABLE "storefront_revisions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99d0d14f9f23b45d2c6648c4b5"`,
    );
    await queryRunner.query(`DROP TABLE "collections"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c0868de1b0aa2a8a3207ca37f0"`,
    );
    await queryRunner.query(`DROP TABLE "rate_limits"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6386ea4d00463337e4d9e50305"`,
    );
    await queryRunner.query(`DROP TABLE "outbox_events"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6498a43d96b79fb3e6091d4fcb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec5508637d45272e4217ed9a91"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9c03b6adebf385ca991d085063"`,
    );
    await queryRunner.query(`DROP TABLE "idempotency_records"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4eefccf0f57508114a1f950b4a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3b6bec4c54f201209558b9e3e"`,
    );
    await queryRunner.query(`DROP INDEX "public"."one_open_return_per_order"`);
    await queryRunner.query(`DROP TABLE "returns"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ab10e580f70c3d2e2e4b31ebf"`,
    );
    await queryRunner.query(`DROP TABLE "promotions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_55dcf88525a9b0a64d8445f827"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_722ff4a1db27817dbe5facce71"`,
    );
    await queryRunner.query(`DROP TABLE "refunds"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9a7d9567320bc4fa02ef9b0bf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_866ddee0e17d9385b4e3b86851"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f8928c02446e7818e6db5b2bce"`,
    );
    await queryRunner.query(`DROP TABLE "order_events"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c4f3f1c3f64b13d56fc5e93cd"`,
    );
    await queryRunner.query(`DROP TABLE "order_lines"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f86975012dff03927c8790b4e5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d49ebb88dbe89528bdd5e80cb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6183642a34a405848c4926c11"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_75eba1c6b1a66b09f2a97e6927"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_80d7245bdbefed8e0c8a8fa267"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_426739267087f74fe174584dfe"`,
    );
    await queryRunner.query(`DROP TABLE "quotes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e0584a3664156caa678765afad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a4d65e8b82289ad2346c90a3a6"`,
    );
    await queryRunner.query(`DROP TABLE "wishlist_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f345c6d477fb6ac3a7976a1583"`,
    );
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e4cc786ce63bdeb9c0dca52fc2"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_movements"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ceba910e3505fc54c3c7f92c94"`,
    );
    await queryRunner.query(`DROP TABLE "inventory"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9df3dfe3b422bc91678a42c694"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4f62b56dd4fb5977b77dc52497"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_36c4c7a3b994abc268f8ebbf48"`,
    );
    await queryRunner.query(`DROP TABLE "variants"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_19ba10fab3217c08913f43357a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1801be3853387931ec035a342e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_464f927ae360106b783ed0b410"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_420d9f679d41281f282f5bc7d0"`,
    );
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8291a56d41c8e1b6e6b536c9af"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e13e410411229ff0bed128e3c"`,
    );
    await queryRunner.query(`DROP TABLE "auth_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a98be8e57a5749c1d8e41edced"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c6580f0551c8b0855ec4d82e55"`,
    );
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f5f74c0fce666f2fdf8c804523"`,
    );
    await queryRunner.query(`DROP TABLE "addresses"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
