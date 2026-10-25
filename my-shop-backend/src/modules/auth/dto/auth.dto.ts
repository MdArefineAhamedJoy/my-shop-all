import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class EmailDto {
  @ApiProperty({ example: "customer@example.com" })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;
}
export class RegisterDto extends EmailDto {
  @ApiProperty({ example: "Customer" })
  @IsString()
  @Length(2, 100)
  name: string;
  @ApiProperty({ minLength: 12, example: "A-strong-password-123!" })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}
export class LoginDto extends EmailDto {
  @ApiProperty() @IsString() @Length(1, 128) password: string;
  @ApiPropertyOptional({
    description: "Required for admin/staff: authenticator code",
  })
  @IsOptional()
  @Matches(/^\d{6}$/)
  mfaCode?: string;
}
export class RefreshDto {
  @ApiProperty() @IsString() @Length(40, 200) refreshToken: string;
}
export class TokenDto {
  @ApiProperty() @IsString() @Length(40, 200) token: string;
}
export class ResetPasswordDto extends TokenDto {
  @ApiProperty({ minLength: 12 })
  @IsString()
  @Length(12, 128)
  newPassword: string;
}
export class ChangePasswordDto {
  @ApiProperty() @IsString() @Length(1, 128) currentPassword: string;
  @ApiProperty({ minLength: 12 })
  @IsString()
  @Length(12, 128)
  newPassword: string;
}
export class PasswordDto {
  @ApiProperty() @IsString() @Length(1, 128) currentPassword: string;
}
export class MfaConfirmDto extends TokenDto {
  @ApiProperty() @Matches(/^\d{6}$/) code: string;
}
