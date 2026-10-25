import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { QueryFailedError, ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { Request, Response } from "express";
import { map } from "rxjs/operators";
import { createHash } from "node:crypto";

export class PageQuery {
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cursor?: string;
}

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "null";
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  query: PageQuery,
  scope: string,
) {
  const alias = qb.alias;
  const scopeHash = digest(scope);
  if (query.cursor) {
    try {
      const c = JSON.parse(Buffer.from(query.cursor, "base64url").toString());
      if (
        c.s !== scopeHash ||
        !/^[a-f\d-]{36}$/i.test(c.id) ||
        !Number.isFinite(Date.parse(c.at))
      )
        throw new Error();
      qb.andWhere(`(${alias}.created_at, ${alias}.id) < (:at, :cursorId)`, {
        at: c.at,
        cursorId: c.id,
      });
    } catch {
      throw new HttpException(
        {
          code: "INVALID_CURSOR",
          message: "Cursor is invalid or belongs to different filters",
        },
        400,
      );
    }
  }
  const rows = await qb
    .orderBy(`${alias}.createdAt`, "DESC")
    .addOrderBy(`${alias}.id`, "DESC")
    .take(query.limit + 1)
    .getMany();
  const hasMore = rows.length > query.limit;
  const items = rows.slice(0, query.limit);
  const last = items.at(-1);
  return {
    data: items,
    meta: {
      hasMore,
      nextCursor:
        hasMore && last
          ? Buffer.from(
              JSON.stringify({ at: last.createdAt, id: last.id, s: scopeHash }),
            ).toString("base64url")
          : null,
    },
  };
}

@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest<Request>();
    const res = ctx.switchToHttp().getResponse<Response>();
    res.setHeader("Cache-Control", "no-store");
    return next
      .handle()
      .pipe(
        map((value) =>
          value &&
          typeof value === "object" &&
          "data" in value &&
          "meta" in value
            ? { ...value, meta: { ...value.meta, requestId: req.requestId } }
            : { data: value ?? null, meta: { requestId: req.requestId } },
        ),
      );
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    let status = 500;
    let body: Record<string, unknown> = {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    };
    if (error instanceof HttpException) {
      status = error.getStatus();
      const response = error.getResponse();
      body =
        typeof response === "string"
          ? { message: response }
          : (response as Record<string, unknown>);
    } else if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      ["entity.parse.failed", "entity.too.large"].includes(String(error.type))
    ) {
      status = error.type === "entity.too.large" ? 413 : 400;
      body = {
        code: status === 413 ? "BODY_TOO_LARGE" : "INVALID_JSON",
        message:
          status === 413
            ? "Request body exceeds the allowed size"
            : "Malformed JSON request body",
      };
    } else if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string }).code;
      if (
        ["23505", "23503", "23514", "40001", "40P01", "55P03"].includes(
          code || "",
        )
      ) {
        status = 409;
        body = {
          code: "DATA_CONFLICT",
          message:
            "Resource changed, is already present, or is referenced. Refresh and retry.",
        };
      } else if (
        [
          "57014",
          "53300",
          "08006",
          "57P01",
          "ECONNREFUSED",
          "ECONNRESET",
          "ETIMEDOUT",
        ].includes(code || "")
      ) {
        status = 503;
        body = {
          code: "DATABASE_BUSY",
          message: "Service is busy. Please retry shortly.",
        };
      }
    }
    if (status === 500)
      console.error(
        JSON.stringify({
          requestId: req.requestId,
          error: error instanceof Error ? error.name : "UnknownError",
        }),
      );
    res.status(status).json({
      error: {
        code: body.code || `HTTP_${status}`,
        message: Array.isArray(body.message)
          ? "Request validation failed"
          : body.message,
        ...(Array.isArray(body.message) ? { details: body.message } : {}),
      },
      meta: { requestId: req.requestId },
    });
  }
}
