import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { Public, Rate, SkipRate } from "../../common/security";
@ApiTags("Health")
@Public()
@Rate(600)
@Controller("health")
export class HealthController {
  constructor(private db: DataSource) {}
  @SkipRate() @Get("live") live() {
    return { status: "ok" };
  }
  @Get("ready") async ready() {
    try {
      await this.db.query("SELECT 1");
      if (await this.db.showMigrations()) throw new Error();
      return { status: "ok", database: "up", migrations: "current" };
    } catch {
      throw new ServiceUnavailableException("Service is not ready");
    }
  }
}
