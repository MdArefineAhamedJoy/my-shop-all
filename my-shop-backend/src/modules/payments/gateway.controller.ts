import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";
import { IsInt, IsString, Length, Min, Max } from "class-validator";
import { Response } from "express";
import { CurrentUser, Permissions, Public, Rate } from "../../common/security";
import { PageQuery } from "../../common/api";
import { VersionDto } from "../catalog/dto/catalog.dto";
import { User } from "../users/entities/user.entity";
import { GatewayService } from "./gateway.service";

export class GatewayRefundDto extends VersionDto {
  @ApiProperty() @IsInt() @Min(1) @Max(1000000000) amountMinor: number;
  @ApiProperty() @IsString() @Length(5, 255) reason: string;
  @ApiProperty() @IsString() @Length(1, 128) currentPassword: string;
}
@ApiTags("Online payments")
@ApiBearerAuth()
@Controller()
export class GatewayController {
  constructor(
    private gateway: GatewayService,
    private config: ConfigService,
  ) {}
  @Post("orders/:id/payment-session")
  @Rate(10, 60)
  initialize(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.gateway.initialize(user.id, id);
  }
  @Post("orders/:id/payment-status")
  @Rate(10, 60)
  status(@CurrentUser() user: User, @Param("id", ParseUUIDPipe) id: string) {
    return this.gateway.reconcile(id, user.id);
  }
  @Public()
  @Post("payments/sslcommerz/ipn")
  @ApiConsumes("application/x-www-form-urlencoded")
  @Rate(120, 60)
  ipn(@Body() body: Record<string, unknown>) {
    return this.gateway.notify(body);
  }
  @Public()
  @Get("payments/sslcommerz/return/:id")
  returnGet(@Param("id", ParseUUIDPipe) id: string, @Res() res: Response) {
    res.redirect(
      303,
      `${(this.config.get<string>("STOREFRONT_URL") || "http://localhost:3000").replace(/\/$/, "")}/account?order=${id}`,
    );
  }
  @Public()
  @Post("payments/sslcommerz/return/:id")
  returnPost(@Param("id", ParseUUIDPipe) id: string, @Res() res: Response) {
    this.returnGet(id, res);
  }
  @Permissions("payments:read")
  @Get("admin/gateway/payments")
  list(@Query() query: PageQuery) {
    return this.gateway.list(query);
  }
  @Permissions("payments:read")
  @Post("admin/orders/:id/payment-reconcile")
  reconcile(@Param("id", ParseUUIDPipe) id: string) {
    return this.gateway.reconcile(id);
  }
  @Permissions("payments:read")
  @Get("admin/gateway/refunds")
  refunds(@Query() query: PageQuery) {
    return this.gateway.refunds(query);
  }
  @Permissions("refunds:record")
  @Post("admin/orders/:id/gateway-refunds")
  @Rate(10, 900)
  @ApiHeader({ name: "Idempotency-Key", required: true })
  refund(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: GatewayRefundDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.gateway.refund(user.id, id, body, key);
  }
  @Permissions("refunds:record")
  @Post("admin/gateway/refunds/:id/reconcile")
  @Rate(20, 60)
  refundStatus(@Param("id", ParseUUIDPipe) id: string) {
    return this.gateway.processRefund(id);
  }
}
