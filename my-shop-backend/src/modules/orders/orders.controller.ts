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
import { ApiBearerAuth, ApiHeader, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Permissions, Rate } from "../../common/security";
import { User } from "../users/entities/user.entity";
import { OrdersService } from "./orders.service";
import { PlaceOrderDto } from "../checkout/dto/checkout.dto";
import {
  CancelOrderDto,
  NoteDto,
  OrderQuery,
  ShipOrderDto,
} from "./dto/order.dto";
import { VersionDto } from "../catalog/dto/catalog.dto";

@ApiTags("Orders")
@ApiBearerAuth()
@Controller()
export class OrdersController {
  constructor(private orders: OrdersService) {}
  @Rate(15)
  @Post("orders")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  place(
    @CurrentUser() user: User,
    @Body() body: PlaceOrderDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.orders.place(user.id, body, key);
  }
  @Get("me/orders") list(
    @CurrentUser() user: User,
    @Query() query: OrderQuery,
  ) {
    return this.orders.list(user.id, query);
  }
  @Get("orders/:id") detail(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.orders.detail(id, user.id);
  }
  @Get("orders/:id/tracking") async tracking(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const order = await this.orders.detail(id, user.id);
    return {
      orderId: id,
      status: order.status,
      courier: order.courier,
      trackingNumber: order.trackingNumber,
      events: order.events,
    };
  }
  @Permissions("customers:read", "orders:read")
  @Get("admin/customers/:id/orders")
  customerOrders(
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: OrderQuery,
  ) {
    return this.orders.list(id, query);
  }
  @Post("orders/:id/cancel")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  cancel(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: CancelOrderDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.orders.cancel(user.id, id, body, false, key);
  }
}

@ApiTags("Admin / Orders")
@ApiBearerAuth()
@Permissions("orders:read")
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private orders: OrdersService) {}
  @Get() list(@Query() query: OrderQuery) {
    return this.orders.list(null, query);
  }
  @Permissions("orders:create")
  @Post()
  @ApiHeader({ name: "Idempotency-Key", required: true })
  create(
    @CurrentUser() user: User,
    @Body() body: PlaceOrderDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.orders.place(user.id, body, key, true);
  }
  @Get(":id") detail(@Param("id", ParseUUIDPipe) id: string) {
    return this.orders.detail(id, null);
  }
  @Permissions("orders:cancel")
  @Post(":id/cancel")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  cancel(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: CancelOrderDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.orders.cancel(user.id, id, body, true, key);
  }
  @Permissions("orders:fulfill")
  @Post(":id/process")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  process(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: VersionDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.orders.transition(
      user.id,
      id,
      body.expectedVersion,
      "process",
      null,
      key,
    );
  }
  @Permissions("orders:fulfill")
  @Post(":id/ship")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  ship(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ShipOrderDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.orders.transition(
      user.id,
      id,
      body.expectedVersion,
      "ship",
      body,
      key,
    );
  }
  @Permissions("orders:fulfill")
  @Post(":id/deliver")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  deliver(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: VersionDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.orders.transition(
      user.id,
      id,
      body.expectedVersion,
      "deliver",
      null,
      key,
    );
  }
  @Post(":id/notes") note(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: NoteDto,
  ) {
    return this.orders.note(user.id, id, body.message);
  }
}
