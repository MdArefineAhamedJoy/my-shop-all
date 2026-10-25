import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "./auth.service";
import {
  ChangePasswordDto,
  EmailDto,
  LoginDto,
  MfaConfirmDto,
  PasswordDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from "./dto/auth.dto";
import { CurrentUser, Public, Rate } from "../../common/security";
import { User } from "../users/entities/user.entity";

@ApiTags("Authentication")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}
  @Public()
  @Rate(5, 900)
  @Post("password-reset/verify")
  verifyReset(@Body() body: TokenDto) {
    return this.auth.verifyResetToken(body.token);
  }
  @Public()
  @Rate(5, 900)
  @Post("register")
  @ApiOperation({
    summary: "Register a customer; role/permission fields are rejected",
  })
  register(@Body() body: RegisterDto, @Req() req: Request) {
    return this.auth.register(body, req.get("user-agent") || "unknown");
  }
  @Public()
  @Rate(10, 900)
  @Post("login")
  login(@Body() body: LoginDto, @Req() req: Request) {
    return this.auth.login(body, req.get("user-agent") || "unknown");
  }
  @Public()
  @Rate(30)
  @Post("refresh")
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }
  @Post("logout") logout(@Req() req: Request) {
    return this.auth.revoke(req.user.id, req.sessionId);
  }
  @Get("session") session(@CurrentUser() user: User) {
    return this.auth.profile(user);
  }
  @Get("sessions") sessions(@CurrentUser() user: User) {
    return this.auth.sessions(user.id);
  }
  @Delete("sessions/:id") revoke(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.auth.revoke(user.id, id);
  }
  @Public() @Rate(3, 900) @Post("password-reset/request") requestReset(
    @Body() body: EmailDto,
  ) {
    return this.auth.requestReset(body.email);
  }
  @Public() @Rate(5, 900) @Post("password-reset/complete") completeReset(
    @Body() body: ResetPasswordDto,
  ) {
    return this.auth.consumeToken(body.token, "reset", body.newPassword);
  }
  @Rate(3, 900) @Post("email-verification/request") requestVerification(
    @CurrentUser() user: User,
  ) {
    return this.auth.requestVerification(user);
  }
  @Public() @Rate(10, 900) @Post("email-verification/complete") verify(
    @Body() body: TokenDto,
  ) {
    return this.auth.consumeToken(body.token, "verify");
  }
  @Rate(5, 900) @Put("password") password(
    @CurrentUser() user: User,
    @Body() body: ChangePasswordDto,
  ) {
    return this.auth.changePassword(user.id, body);
  }
  @Rate(3, 900) @Post("mfa/enrollment") enroll(
    @CurrentUser() user: User,
    @Body() body: PasswordDto,
  ) {
    return this.auth.beginMfa(user.id, body.currentPassword);
  }
  @Rate(5, 900) @Post("mfa/enrollment/confirm") confirm(
    @CurrentUser() user: User,
    @Body() body: MfaConfirmDto,
  ) {
    return this.auth.confirmMfa(user.id, body.token, body.code);
  }
}
