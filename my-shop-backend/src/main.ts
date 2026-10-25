import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { setupApp } from "./setup";
import { DataSource } from "typeorm";
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  setupApp(app);
  if (await app.get(DataSource).showMigrations()) {
    await app.close();
    throw new Error("Pending migrations");
  }
  const port = app.get(ConfigService).getOrThrow<number>("PORT");
  await app.listen(port, "0.0.0.0");
  console.log(
    `MyShop API: http://localhost:${port}/v1 | Swagger: http://localhost:${port}/docs`,
  );
}
void bootstrap().catch(() => {
  console.error(
    "API failed to start. Check environment, database availability and migrations.",
  );
  process.exitCode = 1;
});
