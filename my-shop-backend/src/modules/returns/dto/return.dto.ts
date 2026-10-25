import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { VersionDto } from "../../catalog/dto/catalog.dto";
export class ReturnLineDto {
  @ApiProperty() @IsUUID() orderLineId: string;
  @ApiProperty() @IsInt() @Min(1) @Max(99) quantity: number;
}
export class CreateReturnDto {
  @ApiProperty({ type: [ReturnLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique((line: ReturnLineDto) => line.orderLineId)
  @ValidateNested({ each: true })
  @Type(() => ReturnLineDto)
  lines: ReturnLineDto[];
  @ApiProperty() @IsString() @Length(5, 500) reason: string;
}
export class ReviewReturnDto extends VersionDto {
  @ApiProperty() @IsString() @Length(5, 500) note: string;
}
export class RestockLineDto {
  @ApiProperty() @IsUUID() orderLineId: string;
  @ApiProperty({ description: "0 for damaged goods that cannot be resold" })
  @IsInt()
  @Min(0)
  @Max(99)
  restockQuantity: number;
}
export class InspectReturnDto extends ReviewReturnDto {
  @ApiProperty({ type: [RestockLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique((line: RestockLineDto) => line.orderLineId)
  @ValidateNested({ each: true })
  @Type(() => RestockLineDto)
  lines: RestockLineDto[];
}
