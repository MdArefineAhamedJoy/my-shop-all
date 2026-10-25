import { Module } from "@nestjs/common";
import { CheckoutModule } from "../checkout/checkout.module";
import { OrdersService } from "./orders.service";
import { AdminOrdersController, OrdersController } from "./orders.controller";
@Module({
  imports: [CheckoutModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
