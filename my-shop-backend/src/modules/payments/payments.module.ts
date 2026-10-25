import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { GatewayController } from "./gateway.controller";
import { GatewayService } from "./gateway.service";
import { SslcommerzClient } from "./sslcommerz.client";
@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController, GatewayController],
  providers: [PaymentsService, GatewayService, SslcommerzClient],
})
export class PaymentsModule {}
