import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { CurrentUser, Permissions } from "../../common/security";
import { PageQuery, paginate } from "../../common/api";
import { User } from "../users/entities/user.entity";
import { OutboxEvent } from "./entities/platform.entity";
import { PlatformService } from "./platform.service";
@ApiTags("Admin / Background Jobs")
@ApiBearerAuth()
@Controller("admin/jobs")
export class JobsController {
  constructor(
    private db: DataSource,
    private platform: PlatformService,
  ) {}
  @Permissions("audit:read") @Get() list(@Query() query: PageQuery) {
    return paginate(
      this.db.getRepository(OutboxEvent).createQueryBuilder("e"),
      query,
      "jobs",
    );
  }
  @Permissions("staff:manage") @Post(":id/retry") retry(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.db.transaction(async (m) => {
      const result = await m.update(
        OutboxEvent,
        { id, status: "failed" },
        {
          status: "pending",
          attempts: 0,
          availableAt: new Date(),
          lastError: null,
        },
      );
      if (!result.affected) throw new NotFoundException("Failed job not found");
      await this.platform.audit(m, user.id, "job.retry", id);
      return { queued: true };
    });
  }
}
