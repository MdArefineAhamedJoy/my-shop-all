import { Body, Controller, Get, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsInt, Max, Min } from "class-validator";
import { CurrentUser, Permissions } from "../../common/security";
import { User } from "../users/entities/user.entity";
import { VersionDto } from "../catalog/dto/catalog.dto";
import { SettingsService } from "./settings.service";
export class SettingsDto extends VersionDto {
  @ApiProperty() @IsInt() @Min(0) @Max(10000000) shippingMinor: number;
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100000000)
  freeShippingThresholdMinor: number;
  @ApiProperty() @IsInt() @Min(0) @Max(10000) taxBasisPoints: number;
  @ApiProperty() @IsInt() @Min(1) @Max(365) returnWindowDays: number;
}
@ApiTags("Admin / Settings")
@ApiBearerAuth()
@Permissions("staff:manage")
@Controller("admin/settings")
export class SettingsController {
  constructor(private settings: SettingsService) {}
  @Get() get() {
    return this.settings.get();
  }
  @Put() update(@CurrentUser() user: User, @Body() input: SettingsDto) {
    return this.settings.update(user.id, input);
  }
}
