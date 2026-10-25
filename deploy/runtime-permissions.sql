\getenv runtime_password POSTGRES_API_PASSWORD
SELECT format('CREATE ROLE myshop_api LOGIN PASSWORD %L', :'runtime_password') WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='myshop_api') \gexec
ALTER ROLE myshop_api LOGIN PASSWORD :'runtime_password';
GRANT CONNECT ON DATABASE myshop TO myshop_api;
GRANT USAGE ON SCHEMA public TO myshop_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO myshop_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO myshop_api;
REVOKE INSERT, UPDATE, DELETE ON migrations FROM myshop_api;
REVOKE UPDATE, DELETE ON audit_logs, inventory_movements, order_events, payments, refunds, order_lines FROM myshop_api;
