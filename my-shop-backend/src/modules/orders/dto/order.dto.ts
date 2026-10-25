import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Length } from "class-validator";
import { VersionDto } from "../../catalog/dto/catalog.dto";
import { PageQuery } from "../../../common/api";
export class OrderQuery extends PageQuery {
  @ApiPropertyOptional({
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
  })
  @IsOptional()
  @IsIn(["pending", "processing", "shipped", "delivered", "cancelled"])
  status?: string;
}
export class CancelOrderDto extends VersionDto {
  @ApiProperty() @IsString() @Length(5, 500) reason: string;
}
export class ShipOrderDto extends VersionDto {
  @ApiProperty() @IsString() @Length(2, 100) courier: string;
  @ApiProperty() @IsString() @Length(3, 150) trackingNumber: string;
}
export class NoteDto {
  @ApiProperty() @IsString() @Length(2, 500) message: string;
}
