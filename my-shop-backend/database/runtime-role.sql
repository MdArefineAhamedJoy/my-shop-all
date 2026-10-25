-- Run as the migration owner after migrations, using psql.
-- Supply -v runtime_password='<secret>' through a private secrets mechanism.
-- Never commit real credentials. This file deliberately does not grant DDL.
CREATE ROLE myshop_api LOGIN PASSWORD :'runtime_password';
GRANT CONNECT ON DATABASE myshop TO myshop_api;
GRANT USAGE ON SCHEMA public TO myshop_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO myshop_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO myshop_api;
REVOKE INSERT, UPDATE, DELETE ON migrations FROM myshop_api;
REVOKE UPDATE, DELETE ON audit_logs, inventory_movements, order_events, payments, refunds, order_lines FROM myshop_api;
-- Every new migration must explicitly grant the new runtime permissions.
-- Reapply table-specific append-only revocations after any broader grants.
