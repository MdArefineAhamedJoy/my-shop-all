import { MigrationInterface, QueryRunner } from "typeorm";

export class GatewayPayments1792944709738 implements MigrationInterface {
  name = "GatewayPayments1792944709738";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "gateway_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "order_id" uuid NOT NULL, "transaction_id" character varying(30) NOT NULL, "status" character varying(30) NOT NULL DEFAULT 'initializing', "checkout_url" text, "bank_transaction_id" character varying(150), "verified_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_07baeb704ff23a4c59de1c77451" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_91ec00055d6d6fc8fa6d3ea786" ON "gateway_attempts" ("order_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_84959865abdc8094a788cd3e2f" ON "gateway_attempts" ("transaction_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0e90b8c1446b821dca7a9d72fe" ON "gateway_attempts" ("status", "updated_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "gateway_refunds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version" integer NOT NULL, "order_id" uuid NOT NULL, "actor_id" uuid NOT NULL, "transaction_id" character varying(30) NOT NULL, "amount_minor" integer NOT NULL, "reason" character varying(255) NOT NULL, "status" character varying(30) NOT NULL DEFAULT 'queued', "provider_reference" character varying(150), CONSTRAINT "PK_8290472d79ba2cc23c18658edf2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_095114b7d6cd0f7af0f2085be5" ON "gateway_refunds" ("transaction_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c275d4c4b9655752831caa4d79" ON "gateway_refunds" ("status", "updated_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "gateway_attempts" ADD CONSTRAINT "FK_91ec00055d6d6fc8fa6d3ea786a" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateway_refunds" ADD CONSTRAINT "FK_5c2c6862d338b412d11db655d0a" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gateway_refunds" DROP CONSTRAINT "FK_5c2c6862d338b412d11db655d0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateway_attempts" DROP CONSTRAINT "FK_91ec00055d6d6fc8fa6d3ea786a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c275d4c4b9655752831caa4d79"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_095114b7d6cd0f7af0f2085be5"`,
    );
    await queryRunner.query(`DROP TABLE "gateway_refunds"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0e90b8c1446b821dca7a9d72fe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_84959865abdc8094a788cd3e2f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_91ec00055d6d6fc8fa6d3ea786"`,
    );
    await queryRunner.query(`DROP TABLE "gateway_attempts"`);
  }
}
