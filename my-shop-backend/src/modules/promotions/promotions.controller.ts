import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiProperty,
  ApiTags,
  PartialType,
} from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsISO8601,
  IsInt,
  Matches,
  Max,
  Min,
} from "class-validator";
import { DataSource } from "typeorm";
import { CurrentUser, Permissions } from "../../common/security";
import { PageQuery, paginate } from "../../common/api";
import { User } from "../users/entities/user.entity";
import { PlatformService } from "../platform/platform.service";
import { Promotion } from "./entities/promotion.entity";
class PromotionDto {
  @ApiProperty({ example: "WELCOME10" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9_-]{3,40}$/)
  code: string;
  @ApiProperty({ example: 10 }) @IsInt() @Min(1) @Max(100) percent: number;
  @ApiProperty({ example: 100000 })
  @IsInt()
  @Min(0)
  @Max(1000000000)
  minimumMinor: number;
  @ApiProperty({ example: 100 }) @IsInt() @Min(1) @Max(1000000) maxUses: number;
  @ApiProperty() @IsISO8601({ strict: true }) startsAt: string;
  @ApiProperty() @IsISO8601({ strict: true }) endsAt: string;
  @ApiProperty() @IsBoolean() active: boolean;
}
class UpdatePromotionDto extends PartialType(PromotionDto) {
  @ApiProperty() @IsInt() @Min(1) expectedVersion: number;
}
@ApiTags("Admin / Promotions")
@ApiBearerAuth()
@Permissions("promotions:write")
@Controller("admin/promotions")
export class PromotionsController {
  constructor(
    private db: DataSource,
    private platform: PlatformService,
  ) {}
  @Get() list(@Query() query: PageQuery) {
    return paginate(
      this.db.getRepository(Promotion).createQueryBuilder("p"),
      query,
      "promotions",
    );
  }
  @Post() create(@CurrentUser() user: User, @Body() input: PromotionDto) {
    return this.db.transaction(async (m) => {
      const row = await m.save(
        Promotion,
        m.create(Promotion, {
          ...input,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
        }),
      );
      await this.platform.audit(m, user.id, "promotion.create", row.id);
      return row;
    });
  }
  @Patch(":id") update(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: UpdatePromotionDto,
  ) {
    return this.db.transaction(async (m) => {
      const { expectedVersion, startsAt, endsAt, ...fields } = input;
      const result = await m.update(
        Promotion,
        { id, version: expectedVersion },
        {
          ...fields,
          ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
          ...(endsAt ? { endsAt: new Date(endsAt) } : {}),
        },
      );
      if (!result.affected)
        throw new ConflictException("Promotion missing or VERSION_CONFLICT");
      await this.platform.audit(m, user.id, "promotion.update", id);
      return m.findOneByOrFail(Promotion, { id });
    });
  }
}
