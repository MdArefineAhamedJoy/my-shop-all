import "reflect-metadata";
import "dotenv/config";
import { DataSource, DataSourceOptions } from "typeorm";
import { entities } from "./entities";
import { SnakeNamingStrategy } from "./naming.strategy";
import { join } from "node:path";

export const databaseOptions: DataSourceOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  installExtensions: false,
  ssl:
    process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
  entities,
  namingStrategy: new SnakeNamingStrategy(),
  migrations: [join(__dirname, "migrations/*{.ts,.js}")],
  synchronize: false,
  migrationsRun: false,
  logging: false,
  poolSize: Number(process.env.DB_POOL_MAX || 20),
  extra: {
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
    lock_timeout: 3000,
    idle_in_transaction_session_timeout: 15000,
  },
};
export default new DataSource(databaseOptions);
