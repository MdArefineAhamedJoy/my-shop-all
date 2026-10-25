import { ApiProperty } from "@nestjs/swagger";
import { IsISO8601, IsInt, IsString, Length, Max, Min } from "class-validator";
import { VersionDto } from "../../catalog/dto/catalog.dto";
export class CodCollectionDto extends VersionDto {
  @ApiProperty() @IsInt() @Min(1) @Max(1000000000) amountMinor: number;
  @ApiProperty({ description: "Unique courier/remittance reference" })
  @IsString()
  @Length(5, 150)
  reference: string;
  @ApiProperty() @IsString() @Length(5, 500) evidence: string;
  @ApiProperty({ example: "2026-10-24T10:00:00Z" })
  @IsISO8601({ strict: true })
  collectedAt: string;
}
export class RefundDto extends VersionDto {
  @ApiProperty() @IsInt() @Min(1) @Max(1000000000) amountMinor: number;
  @ApiProperty({
    description: "Unique reference of a refund already paid to the customer",
  })
  @IsString()
  @Length(5, 150)
  reference: string;
  @ApiProperty() @IsString() @Length(5, 500) reason: string;
  @ApiProperty({
    description: "Reauthenticate the financial action; never stored",
  })
  @IsString()
  @Length(1, 128)
  currentPassword: string;
}
