import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AppModule } from "../app.module";
import { createOpenApi, setupApp } from "../setup";
async function generate() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
    bodyParser: false,
  });
  try {
    setupApp(app);
    await app.init();
    await writeFile(
      resolve("openapi.json"),
      JSON.stringify(createOpenApi(app), null, 2) + "\n",
    );
    console.log("Wrote openapi.json");
  } finally {
    await app.close();
  }
}
void generate().catch(() => {
  console.error(
    "OpenAPI generation failed. Check environment/database/migrations.",
  );
  process.exitCode = 1;
});
