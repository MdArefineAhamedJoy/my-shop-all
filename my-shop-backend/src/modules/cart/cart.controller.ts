import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsInt, Max, Min } from "class-validator";
import { CurrentUser } from "../../common/security";
import { PageQuery } from "../../common/api";
import { User } from "../users/entities/user.entity";
import { CartService } from "./cart.service";
class QuantityDto {
  @ApiProperty({ example: 1 }) @IsInt() @Min(1) @Max(99) quantity: number;
}
@ApiTags("Cart & Wishlist")
@ApiBearerAuth()
@Controller()
export class CartController {
  constructor(private carts: CartService) {}
  @Get("cart") get(@CurrentUser() user: User) {
    return this.carts.get(user.id);
  }
  @Put("cart/items/:variantId") put(
    @CurrentUser() user: User,
    @Param("variantId", ParseUUIDPipe) id: string,
    @Body() body: QuantityDto,
  ) {
    return this.carts.put(user.id, id, body.quantity);
  }
  @Delete("cart/items/:variantId") remove(
    @CurrentUser() user: User,
    @Param("variantId", ParseUUIDPipe) id: string,
  ) {
    return this.carts.remove(user.id, id);
  }
  @Delete("cart/items") clear(@CurrentUser() user: User) {
    return this.carts.remove(user.id);
  }
  @Get("me/wishlist") wishlist(
    @CurrentUser() user: User,
    @Query() query: PageQuery,
  ) {
    return this.carts.wishlist(user.id, query);
  }
  @Put("me/wishlist/:productId") wish(
    @CurrentUser() user: User,
    @Param("productId", ParseUUIDPipe) id: string,
  ) {
    return this.carts.wish(user.id, id, true);
  }
  @Delete("me/wishlist/:productId") unwish(
    @CurrentUser() user: User,
    @Param("productId", ParseUUIDPipe) id: string,
  ) {
    return this.carts.wish(user.id, id, false);
  }
}
