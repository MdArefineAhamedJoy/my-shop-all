import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";
import { CurrentUser, Permissions } from "../../common/security";
import { PageQuery } from "../../common/api";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import {
  AddressDto,
  CreateStaffDto,
  ProfileDto,
  StaffPermissionsDto,
} from "./dto/user.dto";
import { AuthService } from "../auth/auth.service";
class AddressUpdate extends AddressDto {
  @ApiProperty() @IsInt() @Min(1) expectedVersion: number;
}
@ApiTags("Customers & Staff")
@ApiBearerAuth()
@Controller()
export class UsersController {
  constructor(
    private users: UsersService,
    private auth: AuthService,
  ) {}
  @Get("me") me(@CurrentUser() user: User) {
    return this.auth.profile(user);
  }
  @Patch("me") profile(@CurrentUser() user: User, @Body() body: ProfileDto) {
    return this.users.profile(user.id, body);
  }
  @Get("me/addresses") addresses(@CurrentUser() user: User) {
    return this.users.addresses(user.id);
  }
  @Post("me/addresses") address(
    @CurrentUser() user: User,
    @Body() body: AddressDto,
  ) {
    return this.users.address(user.id, body);
  }
  @Put("me/addresses/:id") updateAddress(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AddressUpdate,
  ) {
    const { expectedVersion, ...input } = body;
    return this.users.address(user.id, input, id, expectedVersion);
  }
  @Delete("me/addresses/:id") deleteAddress(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.users.removeAddress(user.id, id);
  }
  @Permissions("customers:read") @Get("admin/customers") customers(
    @Query() query: PageQuery,
  ) {
    return this.users.customers(query);
  }
  @Permissions("customers:read") @Get("admin/customers/:id") customer(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.users.customer(id);
  }
  @Permissions("customers:write") @Post("admin/customers/:id/disable") disable(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.users.disable(user.id, id);
  }
  @Permissions("staff:manage") @Get("admin/staff") staff() {
    return this.users.staff();
  }
  @Permissions("staff:manage") @Post("admin/staff") createStaff(
    @CurrentUser() user: User,
    @Body() body: CreateStaffDto,
  ) {
    return this.users.createStaff(user.id, body);
  }
  @Permissions("staff:manage") @Put("admin/staff/:id/permissions") permissions(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: StaffPermissionsDto,
  ) {
    return this.users.staffPermissions(user.id, id, body);
  }
  @Permissions("staff:manage") @Post("admin/staff/:id/disable") disableStaff(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.users.disable(user.id, id);
  }
}
