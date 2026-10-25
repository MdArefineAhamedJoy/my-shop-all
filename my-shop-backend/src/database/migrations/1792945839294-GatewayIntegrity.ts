import { MigrationInterface, QueryRunner } from "typeorm";

export class GatewayIntegrity1792945839294 implements MigrationInterface {
  name = "GatewayIntegrity1792945839294";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gateway_attempts" ADD CONSTRAINT "gateway_attempt_status_check" CHECK ("status" IN ('initializing','pending','unknown','paid','risk','failed'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateway_refunds" ADD CONSTRAINT "gateway_refund_status_check" CHECK ("status" IN ('queued','submitting','unknown','processing','refunded','failed'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateway_refunds" ADD CONSTRAINT "gateway_refund_amount_check" CHECK ("amount_minor" > 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateway_refunds" ADD CONSTRAINT "FK_8eb55ed36317b3c265b94a4b206" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gateway_refunds" DROP CONSTRAINT "FK_8eb55ed36317b3c265b94a4b206"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateway_refunds" DROP CONSTRAINT "gateway_refund_amount_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateway_refunds" DROP CONSTRAINT "gateway_refund_status_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateway_attempts" DROP CONSTRAINT "gateway_attempt_status_check"`,
    );
  }
}
