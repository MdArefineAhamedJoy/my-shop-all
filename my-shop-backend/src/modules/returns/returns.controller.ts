import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiTags } from "@nestjs/swagger";
import { CurrentUser, Permissions } from "../../common/security";
import { PageQuery } from "../../common/api";
import { User } from "../users/entities/user.entity";
import { ReturnsService } from "./returns.service";
import {
  CreateReturnDto,
  InspectReturnDto,
  ReviewReturnDto,
} from "./dto/return.dto";
@ApiTags("Returns")
@ApiBearerAuth()
@Controller()
export class ReturnsController {
  constructor(private returns: ReturnsService) {}
  @Post("orders/:id/returns")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  create(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: CreateReturnDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.returns.create(user.id, id, body, key);
  }
  @Get("returns/:id") detail(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.returns.detail(id, user.id);
  }
  @Permissions("returns:read") @Get("admin/returns") list(
    @Query() query: PageQuery,
  ) {
    return this.returns.list(query);
  }
  @Permissions("returns:read") @Get("admin/returns/:id") adminDetail(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.returns.detail(id);
  }
  @Permissions("returns:review")
  @Post("admin/returns/:id/approve")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  approve(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReviewReturnDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.returns.review(user.id, id, "approve", body, key);
  }
  @Permissions("returns:review")
  @Post("admin/returns/:id/reject")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  reject(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReviewReturnDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.returns.review(user.id, id, "reject", body, key);
  }
  @Permissions("returns:review")
  @Post("admin/returns/:id/receive")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  receive(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReviewReturnDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.returns.review(user.id, id, "receive", body, key);
  }
  @Permissions("returns:review")
  @Post("admin/returns/:id/inspect")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  inspect(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: InspectReturnDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.returns.review(user.id, id, "inspect", body, key);
  }
  @Permissions("returns:review")
  @Post("admin/returns/:id/close")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  close(
    @CurrentUser() user: User,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: ReviewReturnDto,
    @Headers("idempotency-key") key?: string,
  ) {
    return this.returns.review(user.id, id, "close", body, key);
  }
}
