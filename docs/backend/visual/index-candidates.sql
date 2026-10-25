-- Proposed index candidates only. Not executed.
-- Review existing PK/UNIQUE indexes, migration order, data and query plans first.
-- CREATE INDEX CONCURRENTLY, if selected for production, runs outside a transaction.

-- Customer order history: Customer ownership + newest first; keyset cursor avoids deep OFFSET.
CREATE INDEX atlas_orders_1_idx
ON orders (customer_id, created_at DESC, id DESC);

-- Fulfillment queue: Staff status queue; stable order and bounded pages.
CREATE INDEX atlas_orders_2_idx
ON orders (status, created_at DESC, id DESC);

-- Product cohort reporting: Batch product sales joins; verify reporting workload before retaining.
CREATE INDEX atlas_order_items_3_idx
ON order_items (product_id, order_id);

-- Published category listing: Published-only subset; category and gender equality precede newest-first order.
CREATE INDEX atlas_products_4_idx
ON products (category_id, gender, published_at DESC, id DESC)
WHERE status = 'published';

-- Text search: Query must use the identical expression/configuration. Test Bengali/English catalog relevance.
CREATE INDEX atlas_products_5_idx
ON products USING GIN (to_tsvector('simple', name || ' ' || description));

-- Active variant prices: Candidate for variant-level price range/sort. Measure joins to product publication filters.
CREATE INDEX atlas_product_variants_6_idx
ON product_variants (price_minor, id)
WHERE active = true;

-- One default address: Unique partial constraint enforces one default per customer.
CREATE UNIQUE INDEX atlas_addresses_7_idx
ON addresses (customer_id)
WHERE is_default = true;

-- One active customer cart: Unique active-cart invariant without blocking converted cart history.
CREATE UNIQUE INDEX atlas_carts_8_idx
ON carts (customer_id)
WHERE state = 'active' AND customer_id IS NOT NULL;

-- Held reservation expiry: Small expiry scan; timestamp is checked again under transaction locks.
CREATE INDEX atlas_inventory_reservations_9_idx
ON inventory_reservations (expires_at, id)
WHERE state = 'held';

-- One unresolved attempt: Unique partial constraint prevents parallel unresolved payment initialization.
CREATE UNIQUE INDEX atlas_payment_attempts_10_idx
ON payment_attempts (order_id)
WHERE status IN ('created','initializing','pending','unknown');

-- Provider reconciliation: Bounded scans for unresolved provider attempts.
CREATE INDEX atlas_payment_attempts_11_idx
ON payment_attempts (status, initialized_at, id)
WHERE status IN ('initializing','pending','unknown');

-- One applied capture per order: Store duplicate/late captures as exceptions while applying one settlement.
CREATE UNIQUE INDEX atlas_payment_captures_12_idx
ON payment_captures (order_id)
WHERE disposition = 'applied';

-- Undispatched events: Dispatcher claims bounded due batches; incomplete dispatched events need a separate recovery sweep.
CREATE INDEX atlas_outbox_events_13_idx
ON outbox_events (next_attempt_at, occurred_at, id)
WHERE dispatched_at IS NULL;

-- Due background tasks: Lease/retry workers scan only incomplete work.
CREATE INDEX atlas_background_tasks_14_idx
ON background_tasks (next_attempt_at, id)
WHERE state IN ('pending','retry');

-- Pending provider events: Inbox can drain without scanning all accepted callback history.
CREATE INDEX atlas_provider_inbox_15_idx
ON provider_inbox (received_at, id)
WHERE status IN ('pending','retry');

-- Session expiry cleanup: No volatile now() predicate; cleanup binds the cutoff timestamp.
CREATE INDEX atlas_sessions_16_idx
ON sessions (absolute_expires_at, id)
WHERE revoked_at IS NULL;

-- Entity audit trail: Investigate changes to one order/product.
CREATE INDEX atlas_audit_logs_17_idx
ON audit_logs (entity_type, entity_id, occurred_at DESC);

-- Actor audit trail: Investigate privileged actions by one staff identity.
CREATE INDEX atlas_audit_logs_18_idx
ON audit_logs (actor_id, occurred_at DESC);

-- Return review queue: Queue-specific access with bounded time/status filters.
CREATE INDEX atlas_return_requests_19_idx
ON return_requests (status, requested_at, id);

-- Settlement date report: Date-bounded financial reporting; rollups isolate repeated dashboard aggregation.
CREATE INDEX atlas_financial_events_20_idx
ON financial_events (occurred_at, kind);

-- FK lookup: permission_id: Candidate for joins and parent-key checks through permission_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_role_permissions_permission_id_fk ON role_permissions (permission_id);

-- FK lookup: role_id: Candidate for joins and parent-key checks through role_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_user_roles_role_id_fk ON user_roles (role_id);

-- FK lookup: granted_by: Candidate for joins and parent-key checks through granted_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_user_roles_granted_by_fk ON user_roles (granted_by);

-- FK lookup: intended_role_id: Candidate for joins and parent-key checks through intended_role_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_staff_invitations_intended_role_id_fk ON staff_invitations (intended_role_id);

-- FK lookup: invited_by: Candidate for joins and parent-key checks through invited_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_staff_invitations_invited_by_fk ON staff_invitations (invited_by);

-- FK lookup: user_id: Candidate for joins and parent-key checks through user_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_sessions_user_id_fk ON sessions (user_id);

-- FK lookup: user_id: Candidate for joins and parent-key checks through user_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_auth_challenges_user_id_fk ON auth_challenges (user_id);

-- FK lookup: user_id: Candidate for joins and parent-key checks through user_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_mfa_credentials_user_id_fk ON mfa_credentials (user_id);

-- FK lookup: user_id: Candidate for joins and parent-key checks through user_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_mfa_recovery_codes_user_id_fk ON mfa_recovery_codes (user_id);

-- FK lookup: customer_id: Candidate for joins and parent-key checks through customer_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_addresses_customer_id_fk ON addresses (customer_id);

-- FK lookup: parent_id: Candidate for joins and parent-key checks through parent_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_categories_parent_id_fk ON categories (parent_id);

-- FK lookup: category_id: Candidate for joins and parent-key checks through category_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_products_category_id_fk ON products (category_id);

-- FK lookup: product_id: Candidate for joins and parent-key checks through product_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_product_slug_aliases_product_id_fk ON product_slug_aliases (product_id);

-- FK lookup: uploaded_by: Candidate for joins and parent-key checks through uploaded_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_media_assets_uploaded_by_fk ON media_assets (uploaded_by);

-- FK lookup: product_id: Candidate for joins and parent-key checks through product_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_product_media_product_id_fk ON product_media (product_id);

-- FK lookup: variant_id: Candidate for joins and parent-key checks through variant_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_product_media_variant_id_fk ON product_media (variant_id);

-- FK lookup: asset_id: Candidate for joins and parent-key checks through asset_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_product_media_asset_id_fk ON product_media (asset_id);

-- FK lookup: tag_id: Candidate for joins and parent-key checks through tag_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_product_tags_tag_id_fk ON product_tags (tag_id);

-- FK lookup: product_id: Candidate for joins and parent-key checks through product_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_collection_products_product_id_fk ON collection_products (product_id);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_inventory_reservations_order_id_fk ON inventory_reservations (order_id);

-- FK lookup: variant_id: Candidate for joins and parent-key checks through variant_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_inventory_reservations_variant_id_fk ON inventory_reservations (variant_id);

-- FK lookup: variant_id: Candidate for joins and parent-key checks through variant_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_inventory_movements_variant_id_fk ON inventory_movements (variant_id);

-- FK lookup: reservation_id: Candidate for joins and parent-key checks through reservation_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_inventory_movements_reservation_id_fk ON inventory_movements (reservation_id);

-- FK lookup: actor_id: Candidate for joins and parent-key checks through actor_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_inventory_movements_actor_id_fk ON inventory_movements (actor_id);

-- FK lookup: customer_id: Candidate for joins and parent-key checks through customer_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_carts_customer_id_fk ON carts (customer_id);

-- FK lookup: variant_id: Candidate for joins and parent-key checks through variant_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_cart_items_variant_id_fk ON cart_items (variant_id);

-- FK lookup: product_id: Candidate for joins and parent-key checks through product_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_wishlist_items_product_id_fk ON wishlist_items (product_id);

-- FK lookup: customer_id: Candidate for joins and parent-key checks through customer_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_checkout_quotes_customer_id_fk ON checkout_quotes (customer_id);

-- FK lookup: cart_id: Candidate for joins and parent-key checks through cart_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_checkout_quotes_cart_id_fk ON checkout_quotes (cart_id);

-- FK lookup: rules_version: Candidate for joins and parent-key checks through rules_version. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_checkout_quotes_rules_version_fk ON checkout_quotes (rules_version);

-- FK lookup: promotion_id: Candidate for joins and parent-key checks through promotion_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_promotion_claims_promotion_id_fk ON promotion_claims (promotion_id);

-- FK lookup: quote_id: Candidate for joins and parent-key checks through quote_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_promotion_claims_quote_id_fk ON promotion_claims (quote_id);

-- FK lookup: customer_id: Candidate for joins and parent-key checks through customer_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_promotion_claims_customer_id_fk ON promotion_claims (customer_id);

-- FK lookup: published_by: Candidate for joins and parent-key checks through published_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_pricing_policy_versions_published_by_fk ON pricing_policy_versions (published_by);

-- FK lookup: placed_by_staff_id: Candidate for joins and parent-key checks through placed_by_staff_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_orders_placed_by_staff_id_fk ON orders (placed_by_staff_id);

-- FK lookup: rules_version: Candidate for joins and parent-key checks through rules_version. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_orders_rules_version_fk ON orders (rules_version);

-- FK lookup: variant_id: Candidate for joins and parent-key checks through variant_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_order_items_variant_id_fk ON order_items (variant_id);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_guest_order_capabilities_order_id_fk ON guest_order_capabilities (order_id);

-- FK lookup: claimed_by: Candidate for joins and parent-key checks through claimed_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_guest_order_capabilities_claimed_by_fk ON guest_order_capabilities (claimed_by);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_order_status_events_order_id_fk ON order_status_events (order_id);

-- FK lookup: actor_id: Candidate for joins and parent-key checks through actor_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_order_status_events_actor_id_fk ON order_status_events (actor_id);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_order_notes_order_id_fk ON order_notes (order_id);

-- FK lookup: actor_id: Candidate for joins and parent-key checks through actor_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_order_notes_actor_id_fk ON order_notes (actor_id);

-- FK lookup: order_item_id: Candidate for joins and parent-key checks through order_item_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_shipment_items_order_item_id_fk ON shipment_items (order_item_id);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_payment_attempts_order_id_fk ON payment_attempts (order_id);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_payment_captures_order_id_fk ON payment_captures (order_id);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_cod_collections_order_id_fk ON cod_collections (order_id);

-- FK lookup: shipment_id: Candidate for joins and parent-key checks through shipment_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_cod_collections_shipment_id_fk ON cod_collections (shipment_id);

-- FK lookup: evidence_asset_id: Candidate for joins and parent-key checks through evidence_asset_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_cod_collections_evidence_asset_id_fk ON cod_collections (evidence_asset_id);

-- FK lookup: recorded_by: Candidate for joins and parent-key checks through recorded_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_cod_collections_recorded_by_fk ON cod_collections (recorded_by);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_refunds_order_id_fk ON refunds (order_id);

-- FK lookup: capture_id: Candidate for joins and parent-key checks through capture_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_refunds_capture_id_fk ON refunds (capture_id);

-- FK lookup: cod_collection_id: Candidate for joins and parent-key checks through cod_collection_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_refunds_cod_collection_id_fk ON refunds (cod_collection_id);

-- FK lookup: return_request_id: Candidate for joins and parent-key checks through return_request_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_refunds_return_request_id_fk ON refunds (return_request_id);

-- FK lookup: approved_by: Candidate for joins and parent-key checks through approved_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_refunds_approved_by_fk ON refunds (approved_by);

-- FK lookup: order_item_id: Candidate for joins and parent-key checks through order_item_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_refund_items_order_item_id_fk ON refund_items (order_item_id);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_financial_events_order_id_fk ON financial_events (order_id);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_return_requests_order_id_fk ON return_requests (order_id);

-- FK lookup: requested_by: Candidate for joins and parent-key checks through requested_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_return_requests_requested_by_fk ON return_requests (requested_by);

-- FK lookup: approved_by: Candidate for joins and parent-key checks through approved_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_return_requests_approved_by_fk ON return_requests (approved_by);

-- FK lookup: order_item_id: Candidate for joins and parent-key checks through order_item_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_return_items_order_item_id_fk ON return_items (order_item_id);

-- FK lookup: asset_id: Candidate for joins and parent-key checks through asset_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_return_evidence_asset_id_fk ON return_evidence (asset_id);

-- FK lookup: order_id: Candidate for joins and parent-key checks through order_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_documents_order_id_fk ON documents (order_id);

-- FK lookup: refund_id: Candidate for joins and parent-key checks through refund_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_documents_refund_id_fk ON documents (refund_id);

-- FK lookup: authored_by: Candidate for joins and parent-key checks through authored_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_storefront_revisions_authored_by_fk ON storefront_revisions (authored_by);

-- FK lookup: storefront_revision_id: Candidate for joins and parent-key checks through storefront_revision_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_banners_storefront_revision_id_fk ON banners (storefront_revision_id);

-- FK lookup: desktop_asset_id: Candidate for joins and parent-key checks through desktop_asset_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_banners_desktop_asset_id_fk ON banners (desktop_asset_id);

-- FK lookup: mobile_asset_id: Candidate for joins and parent-key checks through mobile_asset_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_banners_mobile_asset_id_fk ON banners (mobile_asset_id);

-- FK lookup: active_storefront_revision_id: Candidate for joins and parent-key checks through active_storefront_revision_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_store_settings_active_storefront_revision_id_fk ON store_settings (active_storefront_revision_id);

-- FK lookup: active_pricing_policy_id: Candidate for joins and parent-key checks through active_pricing_policy_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_store_settings_active_pricing_policy_id_fk ON store_settings (active_pricing_policy_id);

-- FK lookup: customer_id: Candidate for joins and parent-key checks through customer_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_consent_events_customer_id_fk ON consent_events (customer_id);

-- FK lookup: event_id: Candidate for joins and parent-key checks through event_id. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_consumer_receipts_event_id_fk ON consumer_receipts (event_id);

-- FK lookup: requested_by: Candidate for joins and parent-key checks through requested_by. Review write cost and query plans; PostgreSQL does not automatically index the referencing side.
CREATE INDEX atlas_report_jobs_requested_by_fk ON report_jobs (requested_by);
