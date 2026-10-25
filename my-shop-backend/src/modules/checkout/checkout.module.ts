import { Module } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";
import {
  AdminCheckoutController,
  CheckoutController,
} from "./checkout.controller";
@Module({
  controllers: [CheckoutController, AdminCheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
