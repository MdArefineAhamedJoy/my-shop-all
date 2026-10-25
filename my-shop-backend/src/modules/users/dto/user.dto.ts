import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { VersionDto } from "../../catalog/dto/catalog.dto";
import { RegisterDto } from "../../auth/dto/auth.dto";
import { PERMISSIONS } from "../../../common/security";

export class ProfileDto extends VersionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\+?[0-9 -]{7,30}$/)
  phone?: string;
}
export class ShippingAddressDto {
  @ApiProperty({ example: "Test Customer" })
  @IsString()
  @Length(2, 100)
  name: string;
  @ApiProperty({ example: "+8801700000000" })
  @Matches(/^\+?[0-9 -]{7,30}$/)
  phone: string;
  @ApiProperty({ example: "12 Sample Road" })
  @IsString()
  @Length(5, 200)
  line1: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;
  @ApiProperty({ example: "Dhaka" }) @IsString() @Length(2, 100) city: string;
  @ApiProperty({ example: "Dhaka" }) @IsString() @Length(2, 100) region: string;
  @ApiProperty({ example: "1207" })
  @IsString()
  @Length(3, 12)
  postalCode: string;
  @ApiProperty({ enum: ["BD"], default: "BD" })
  @IsIn(["BD"])
  countryCode: string;
}
export class AddressDto {
  @ApiProperty({ example: "Home" }) @IsString() @Length(1, 50) label: string;
  @ApiProperty({ type: ShippingAddressDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  details: ShippingAddressDto;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}
export class CreateStaffDto extends RegisterDto {
  @ApiProperty({ type: [String], enum: PERMISSIONS })
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsIn(PERMISSIONS, { each: true })
  permissions: string[];
}
export class StaffPermissionsDto extends VersionDto {
  @ApiProperty({ type: [String], enum: PERMISSIONS })
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsIn(PERMISSIONS, { each: true })
  permissions: string[];
}
