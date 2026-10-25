import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { ShippingAddressDto } from "../../users/dto/user.dto";

export class CreateQuoteDto {
  @ApiProperty({ type: ShippingAddressDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
  @ApiProperty({ enum: ["cod", "sslcommerz"], default: "cod" })
  @IsIn(["cod", "sslcommerz"])
  paymentMethod: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 40)
  promotionCode?: string;
}
export class PlaceOrderDto {
  @ApiProperty() @IsUUID() quoteId: string;
}
export class ManualItemDto {
  @ApiProperty() @IsUUID() variantId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(99) quantity: number;
}
export class ManualQuoteDto extends CreateQuoteDto {
  @ApiProperty() @IsUUID() customerId: string;
  @ApiProperty({ type: [ManualItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique((line: ManualItemDto) => line.variantId)
  @ValidateNested({ each: true })
  @Type(() => ManualItemDto)
  items: ManualItemDto[];
}
