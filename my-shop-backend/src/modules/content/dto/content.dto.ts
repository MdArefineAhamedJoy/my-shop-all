import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
export class CollectionDto {
  @ApiProperty() @IsString() @Length(2, 100) name: string;
  @ApiProperty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(120)
  slug: string;
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  productIds: string[];
  @ApiProperty() @IsBoolean() active: boolean;
}
export class BannerDto {
  @ApiProperty() @IsString() @Length(1, 150) title: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;
  @ApiProperty()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  imageUrl: string;
  @ApiProperty({ example: "/shop" })
  @Matches(/^\/(?!\/)[a-zA-Z0-9\/_?=&%-]*$/)
  @MaxLength(300)
  target: string;
}
export class StorefrontDto {
  @ApiProperty() @IsString() @Length(1, 100) storeName: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  announcement?: string;
  @ApiProperty({ type: [BannerDto] })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => BannerDto)
  banners: BannerDto[];
  @ApiProperty() @IsEmail() contactEmail: string;
  @ApiProperty() @Matches(/^\+?[0-9 -]{7,30}$/) contactPhone: string;
}
export class NewsletterDto {
  @ApiProperty() @TransformEmail() @IsEmail() @MaxLength(254) email: string;
  @ApiProperty({ example: "2026-10" })
  @IsString()
  @Length(1, 100)
  consentRevision: string;
}
function TransformEmail() {
  return Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  );
}
