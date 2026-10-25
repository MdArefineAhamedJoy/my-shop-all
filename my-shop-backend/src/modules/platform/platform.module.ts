import { Global, Module } from "@nestjs/common";
import { PlatformService } from "./platform.service";
import { OutboxWorker } from "./outbox.worker";
import { JobsController } from "./jobs.controller";

@Global()
@Module({
  controllers: [JobsController],
  providers: [PlatformService, OutboxWorker],
  exports: [PlatformService],
})
export class PlatformModule {}
