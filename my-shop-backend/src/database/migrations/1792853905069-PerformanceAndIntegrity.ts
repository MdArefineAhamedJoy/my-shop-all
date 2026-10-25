import { MigrationInterface, QueryRunner } from "typeorm";

export class PerformanceAndIntegrity1792853905069 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      `CREATE INDEX products_search_idx ON products USING GIN (to_tsvector('simple', name || ' ' || description))`,
    );
    await q.query(
      "CREATE INDEX products_tags_idx ON products USING GIN (tags)",
    );
    await q.query(
      "CREATE INDEX payments_collected_at_idx ON payments (collected_at)",
    );
    await q.query(
      "CREATE INDEX refunds_created_at_idx ON refunds (created_at)",
    );
    await q.query("CREATE INDEX orders_created_at_idx ON orders (created_at)");
    await q.query(
      "CREATE INDEX idempotency_created_at_idx ON idempotency_records (created_at)",
    );
    await q.query("CREATE INDEX sessions_expiry_idx ON sessions (expires_at)");
    await q.query("CREATE INDEX tokens_expiry_idx ON auth_tokens (expires_at)");
    await q.query(
      "CREATE UNIQUE INDEX one_default_address_per_user ON addresses (user_id) WHERE is_default = true",
    );
    await q.query(
      "CREATE UNIQUE INDEX one_published_storefront ON storefront_revisions (published) WHERE published = true",
    );
    await q.query(
      "ALTER TABLE inventory ADD CONSTRAINT inventory_upper_bound CHECK (available <= 10000000)",
    );
    await q.query(
      "ALTER TABLE inventory_movements ADD CONSTRAINT movement_nonzero CHECK (quantity <> 0)",
    );
    await q.query(
      "ALTER TABLE users ADD CONSTRAINT normalized_email CHECK (email = lower(trim(email)))",
    );
    for (const table of [
      "inventory_movements",
      "order_events",
      "payments",
      "refunds",
      "audit_logs",
      "storefront_revisions",
    ]) {
      await q.query(
        `ALTER TABLE ${table} ADD CONSTRAINT ${table}_actor_fk FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT`,
      );
    }
    await q.query(
      "ALTER TABLE returns ADD CONSTRAINT returns_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT",
    );
    await q.query(
      "ALTER TABLE quotes ADD CONSTRAINT quotes_promotion_fk FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE RESTRICT",
    );
    await q.query(
      "ALTER TABLE inventory_movements ADD CONSTRAINT movements_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT",
    );
  }
  async down(q: QueryRunner) {
    await q.query(
      "ALTER TABLE inventory_movements DROP CONSTRAINT movements_order_fk",
    );
    await q.query("ALTER TABLE quotes DROP CONSTRAINT quotes_promotion_fk");
    await q.query("ALTER TABLE returns DROP CONSTRAINT returns_user_fk");
    for (const table of [
      "inventory_movements",
      "order_events",
      "payments",
      "refunds",
      "audit_logs",
      "storefront_revisions",
    ])
      await q.query(`ALTER TABLE ${table} DROP CONSTRAINT ${table}_actor_fk`);
    await q.query("ALTER TABLE users DROP CONSTRAINT normalized_email");
    await q.query(
      "ALTER TABLE inventory_movements DROP CONSTRAINT movement_nonzero",
    );
    await q.query(
      "ALTER TABLE inventory DROP CONSTRAINT inventory_upper_bound",
    );
    for (const index of [
      "one_published_storefront",
      "one_default_address_per_user",
      "tokens_expiry_idx",
      "sessions_expiry_idx",
      "idempotency_created_at_idx",
      "orders_created_at_idx",
      "refunds_created_at_idx",
      "payments_collected_at_idx",
      "products_tags_idx",
      "products_search_idx",
    ])
      await q.query(`DROP INDEX ${index}`);
  }
}
