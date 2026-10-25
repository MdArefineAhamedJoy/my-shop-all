import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CatalogService } from "./catalog.service";
import { CurrentUser, Permissions, Public } from "../../common/security";
import { User } from "../users/entities/user.entity";
import {
  CategoryDto,
  CreateProductDto,
  ProductQuery,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateVariantDto,
  VariantDto,
  VersionDto,
} from "./dto/catalog.dto";

@ApiTags("Catalog")
@Controller()
export class CatalogController {
  constructor(private catalog: CatalogService) {}
  @Public() @Get("products") list(@Query() query: ProductQuery) {
    return this.catalog.list(query);
  }
  @Public() @Get("products/:slug") detail(@Param("slug") slug: string) {
    return this.catalog.detail(slug);
  }
  @Public() @Get("products/:id/related") related(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.catalog.related(id);
  }
  @Public() @Get("categories") categories() {
    return this.catalog.categories();
  }
}

@ApiTags("Admin / Catalog")
@ApiBearerAuth()
@Permissions("catalog:read")
@Controller("admin")
export class AdminCatalogController {
  constructor(private catalog: CatalogService) {}
  @Get("products") list(@Query() query: ProductQuery) {
    return this.catalog.list(query, true);
  }
  @Get("products/:id") detail(@Param("id", ParseUUIDPipe) id: string) {
    return this.catalog.detail(id, true);
  }
  @Permissions("catalog:write") @Post("products") create(
    @CurrentUser() user: User,
    @Body() body: CreateProductDto,
  ) {
    return this.catalog.create(user.id, body);
  }
  @Permissions("catalog:write") @Patch("products/:id") update(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.catalog.update(user.id, id, body);
  }
  @Permissions("catalog:write") @Post("products/:id/publish") publish(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: VersionDto,
  ) {
    return this.catalog.setStatus(
      user.id,
      id,
      body.expectedVersion,
      "published",
    );
  }
  @Permissions("catalog:write") @Post("products/:id/archive") archive(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: VersionDto,
  ) {
    return this.catalog.setStatus(
      user.id,
      id,
      body.expectedVersion,
      "archived",
    );
  }
  @Permissions("catalog:write") @Post("products/:id/variants") variant(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: VariantDto,
  ) {
    return this.catalog.addVariant(user.id, id, body);
  }
  @Permissions("catalog:write") @Patch("variants/:id") updateVariant(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateVariantDto,
  ) {
    return this.catalog.updateVariant(user.id, id, body);
  }
  @Get("categories") categories() {
    return this.catalog.categories(true);
  }
  @Permissions("catalog:write") @Post("categories") category(
    @CurrentUser() user: User,
    @Body() body: CategoryDto,
  ) {
    return this.catalog.createCategory(user.id, body);
  }
  @Permissions("catalog:write") @Patch("categories/:id") updateCategory(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.catalog.updateCategory(user.id, id, body);
  }
  @Permissions("catalog:write") @Delete("categories/:id") deleteCategory(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.catalog.deleteCategory(user.id, id);
  }
}
