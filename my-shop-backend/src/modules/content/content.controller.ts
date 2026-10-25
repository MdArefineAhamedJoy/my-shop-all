import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";
import { CurrentUser, Permissions, Public, Rate } from "../../common/security";
import { User } from "../users/entities/user.entity";
import { ContentService } from "./content.service";
import { CollectionDto, NewsletterDto, StorefrontDto } from "./dto/content.dto";
import { TokenDto } from "../auth/dto/auth.dto";
import { VersionDto } from "../catalog/dto/catalog.dto";
class UpdateCollectionDto extends CollectionDto {
  @ApiProperty() @IsInt() @Min(1) expectedVersion: number;
}
@ApiTags("Content & Newsletter")
@ApiBearerAuth()
@Controller()
export class ContentController {
  constructor(private content: ContentService) {}
  @Public() @Get("storefront") storefront() {
    return this.content.storefront();
  }
  @Public() @Get("collections") collections() {
    return this.content.collections();
  }
  @Permissions("content:read") @Get("admin/collections") adminCollections() {
    return this.content.collections(true);
  }
  @Permissions("content:write") @Post("admin/collections") create(
    @CurrentUser() user: User,
    @Body() body: CollectionDto,
  ) {
    return this.content.collection(user.id, body);
  }
  @Permissions("content:write") @Put("admin/collections/:id") update(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateCollectionDto,
  ) {
    const { expectedVersion, ...fields } = body;
    return this.content.collection(user.id, fields, id, expectedVersion);
  }
  @Permissions("content:read") @Get("admin/storefront") revisions() {
    return this.content.revisions();
  }
  @Permissions("content:write") @Post("admin/storefront/draft") draft(
    @CurrentUser() user: User,
    @Body() body: StorefrontDto,
  ) {
    return this.content.draft(user.id, body);
  }
  @Permissions("content:write") @Post("admin/storefront/:id/publish") publish(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: VersionDto,
  ) {
    return this.content.publish(user.id, id, body.expectedVersion);
  }
  @Public() @Rate(3, 900) @Post("newsletter/subscriptions") subscribe(
    @Body() body: NewsletterDto,
  ) {
    return this.content.subscribe(body);
  }
  @Public() @Rate(10, 900) @Post("newsletter/confirm") confirm(
    @Body() body: TokenDto,
  ) {
    return this.content.confirm(body.token);
  }
  @Public() @Rate(10, 900) @Post("newsletter/unsubscribe") unsubscribe(
    @Body() body: TokenDto,
  ) {
    return this.content.unsubscribe(body.token);
  }
}
