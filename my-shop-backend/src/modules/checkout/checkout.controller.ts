import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Permissions, Public, Rate } from "../../common/security";
import { User } from "../users/entities/user.entity";
import { CheckoutService } from "./checkout.service";
import { CreateQuoteDto, ManualQuoteDto } from "./dto/checkout.dto";
@ApiTags("Checkout")
@ApiBearerAuth()
@Controller("checkout")
export class CheckoutController {
  constructor(private checkout: CheckoutService) {}
  @Public() @Get("options") options() {
    return this.checkout.options();
  }
  @Rate(20) @Post("quotes") quote(
    @CurrentUser() user: User,
    @Body() body: CreateQuoteDto,
  ) {
    return this.checkout.quote(user.id, body);
  }
}
@ApiTags("Admin / Orders")
@ApiBearerAuth()
@Controller("admin/checkout")
export class AdminCheckoutController {
  constructor(private checkout: CheckoutService) {}
  @Permissions("orders:create") @Post("quotes") quote(
    @CurrentUser() user: User,
    @Body() body: ManualQuoteDto,
  ) {
    return this.checkout.manualQuote(user.id, body);
  }
}
