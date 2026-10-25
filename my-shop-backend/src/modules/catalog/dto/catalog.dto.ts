import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { PageQuery } from "../../../common/api";

export class VersionDto {
  @ApiProperty({ example: 1 }) @IsInt() @Min(1) expectedVersion: number;
}
export class CategoryDto {
  @ApiProperty() @IsString() @Length(2, 100) name: string;
  @ApiProperty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}
export class UpdateCategoryDto extends PartialType(CategoryDto) {
  @ApiProperty() @IsInt() @Min(1) expectedVersion: number;
}
export class VariantDto {
  @ApiProperty({ example: "SHIRT-NAVY-M" })
  @Matches(/^[A-Za-z0-9_-]+$/)
  @Length(1, 80)
  sku: string;
  @ApiProperty({ example: "M" }) @IsString() @Length(1, 30) size: string;
  @ApiProperty({ example: "navy" }) @IsString() @Length(1, 50) color: string;
  @ApiProperty({ example: 129900, description: "BDT minor units (paisa)" })
  @IsInt()
  @Min(1)
  @Max(100000000)
  priceMinor: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000000)
  compareAtMinor?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}
export class UpdateVariantDto extends PartialType(VariantDto) {
  @ApiProperty() @IsInt() @Min(1) expectedVersion: number;
}
export class ProductFieldsDto {
  @ApiProperty() @IsString() @Length(2, 200) name: string;
  @ApiProperty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(220)
  slug: string;
  @ApiProperty() @IsString() @Length(10, 20000) description: string;
  @ApiProperty() @IsUUID() categoryId: string;
  @ApiProperty({ enum: ["men", "women", "unisex"] })
  @IsIn(["men", "women", "unisex"])
  gender: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(12)
  @IsUrl(
    {
      protocols: ["https", "http"],
      require_protocol: true,
      require_tld: false,
    },
    { each: true },
  )
  images: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isNew?: boolean;
}
export class CreateProductDto extends ProductFieldsDto {
  @ApiProperty({ type: [VariantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants: VariantDto[];
}
export class UpdateProductDto extends PartialType(ProductFieldsDto) {
  @ApiProperty() @IsInt() @Min(1) expectedVersion: number;
}
export class ProductQuery extends PageQuery {
  @ApiPropertyOptional({ description: "Category slug" })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 100) q?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional({ enum: ["men", "women", "unisex"] })
  @IsOptional()
  @IsIn(["men", "women", "unisex"])
  gender?: string;
  @ApiPropertyOptional({
    enum: ["draft", "published", "archived"],
    description: "Admin list only",
  })
  @IsOptional()
  @IsIn(["draft", "published", "archived"])
  status?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000000)
  minPriceMinor?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000000)
  maxPriceMinor?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 30) size?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 50)
  color?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 40) tag?: string;
  @ApiPropertyOptional({ description: "Collection UUID" })
  @IsOptional()
  @IsUUID()
  collectionId?: string;
}
