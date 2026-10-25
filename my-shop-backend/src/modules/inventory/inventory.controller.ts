import {
  Body,
  ConflictException,
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
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";
import {
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  NotEquals,
} from "class-validator";
import { DataSource } from "typeorm";
import { CurrentUser, Permissions } from "../../common/security";
import { PageQuery, paginate } from "../../common/api";
import { User } from "../users/entities/user.entity";
import { PlatformService } from "../platform/platform.service";
import { Inventory, InventoryMovement } from "./entities/inventory.entity";
import { VersionDto } from "../catalog/dto/catalog.dto";

class AdjustmentDto extends VersionDto {
  @ApiProperty() @IsUUID() variantId: string;
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(-1000000)
  @Max(1000000)
  @NotEquals(0)
  quantity: number;
  @ApiProperty({ example: "Initial stock receipt" })
  @IsString()
  @Length(5, 300)
  reason: string;
}
@ApiTags("Admin / Inventory")
@ApiBearerAuth()
@Permissions("inventory:read")
@Controller("admin/inventory")
export class InventoryController {
  constructor(
    private db: DataSource,
    private platform: PlatformService,
  ) {}
  @Get(":variantId") async detail(
    @Param("variantId", ParseUUIDPipe) variantId: string,
  ) {
    const row = await this.db.getRepository(Inventory).findOneBy({ variantId });
    if (!row) throw new ConflictException("Inventory record not found");
    return row;
  }
  @Get() list(@Query() query: PageQuery) {
    return paginate(
      this.db
        .getRepository(Inventory)
        .createQueryBuilder("s")
        .innerJoinAndSelect("s.variant", "v"),
      query,
      "inventory",
    );
  }
  @Get(":variantId/movements") movements(
    @Param("variantId", ParseUUIDPipe) id: string,
    @Query() query: PageQuery,
  ) {
    return paginate(
      this.db
        .getRepository(InventoryMovement)
        .createQueryBuilder("m")
        .where("m.variantId = :id", { id }),
      query,
      `movements:${id}`,
    );
  }
  @Permissions("inventory:adjust")
  @Post("adjustments")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  adjust(
    @CurrentUser() user: User,
    @Body() input: AdjustmentDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.platform.command(`stock:${user.id}`, key, input, async (m) => {
      const stock = await m.findOne(Inventory, {
        where: { variantId: input.variantId },
        lock: { mode: "pessimistic_write" },
      });
      if (!stock || stock.version !== input.expectedVersion)
        throw new ConflictException("Stock missing or VERSION_CONFLICT");
      if (
        stock.available + input.quantity < 0 ||
        stock.available + input.quantity > 10000000
      )
        throw new ConflictException("Stock must remain between 0 and 10000000");
      stock.available += input.quantity;
      await m.save(
        InventoryMovement,
        m.create(InventoryMovement, {
          variantId: input.variantId,
          quantity: input.quantity,
          actorId: user.id,
          reason: input.reason,
        }),
      );
      await this.platform.audit(m, user.id, "inventory.adjust", stock.id, {
        quantity: input.quantity,
        reason: input.reason,
      });
      return m.save(stock);
    });
  }
}
