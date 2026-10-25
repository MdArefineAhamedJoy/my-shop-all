import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser, Permissions, Rate } from "../../common/security";
import { PageQuery } from "../../common/api";
import { User } from "../users/entities/user.entity";
import { PaymentsService } from "./payments.service";
import { CodCollectionDto, RefundDto } from "./dto/payment.dto";
@ApiTags("Admin / Payments")
@ApiBearerAuth()
@Controller("admin")
export class PaymentsController {
  constructor(private payments: PaymentsService) {}
  @Permissions("payments:read") @Get("payments") list(
    @Query() query: PageQuery,
  ) {
    return this.payments.payments(query);
  }
  @Permissions("payments:read") @Get("refunds") refunds(
    @Query() query: PageQuery,
  ) {
    return this.payments.refunds(query);
  }
  @Permissions("cod:record")
  @Post("orders/:id/cod-collections")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  collection(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: CodCollectionDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.payments.collect(user.id, id, body, key);
  }
  @Permissions("refunds:record")
  @Rate(10, 900)
  @Post("orders/:id/refunds")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  @ApiOperation({
    summary:
      "Record a COD refund paid externally; this endpoint does not transfer money",
  })
  refund(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: RefundDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.payments.refund(user.id, id, body, key);
  }
}
