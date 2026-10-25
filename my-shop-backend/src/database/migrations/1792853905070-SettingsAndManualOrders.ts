import { MigrationInterface, QueryRunner } from "typeorm";
export class SettingsAndManualOrders1792853905070 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE store_settings (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), version integer NOT NULL, shipping_minor integer NOT NULL, free_shipping_threshold_minor integer NOT NULL, tax_basis_points integer NOT NULL, return_window_days integer NOT NULL, CONSTRAINT singleton_settings CHECK (id='00000000-0000-4000-8000-000000000001'), CONSTRAINT valid_settings CHECK (shipping_minor BETWEEN 0 AND 10000000 AND free_shipping_threshold_minor BETWEEN 0 AND 100000000 AND tax_basis_points BETWEEN 0 AND 10000 AND return_window_days BETWEEN 1 AND 365))`,
    );
    await q.query(
      "ALTER TABLE quotes ADD COLUMN policy_version integer NOT NULL DEFAULT 1, ADD COLUMN created_by_id uuid REFERENCES users(id) ON DELETE RESTRICT",
    );
  }
  async down(q: QueryRunner) {
    await q.query(
      "ALTER TABLE quotes DROP COLUMN created_by_id, DROP COLUMN policy_version",
    );
    await q.query("DROP TABLE store_settings");
  }
}
