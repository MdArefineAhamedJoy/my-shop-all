import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
  HttpException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { DataSource } from "typeorm";
import { Request } from "express";
import { Role } from "../modules/users/entities/user.entity";
import { Session } from "../modules/auth/entities/session.entity";
import { digest } from "./api";

export const Public = () => SetMetadata("public", true);
export const Permissions = (...permissions: string[]) =>
  SetMetadata("permissions", permissions);
export const Rate = (limit: number, seconds = 60) =>
  SetMetadata("rate", { limit, seconds });
export const SkipRate = () => SetMetadata("skipRate", true);
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<Request>().user,
);
export const PERMISSIONS = [
  "catalog:read",
  "catalog:write",
  "inventory:read",
  "inventory:adjust",
  "orders:read",
  "orders:create",
  "orders:fulfill",
  "orders:cancel",
  "customers:read",
  "customers:write",
  "returns:read",
  "returns:review",
  "payments:read",
  "cod:record",
  "refunds:record",
  "reports:read",
  "content:read",
  "content:write",
  "promotions:write",
  "audit:read",
  "staff:manage",
] as const;

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    private db: DataSource,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>("public", [
        ctx.getHandler(),
        ctx.getClass(),
      ])
    )
      return true;
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ") && !header?.startsWith("Session "))
      throw new UnauthorizedException("Bearer access token is required");
    try {
      const token = header.startsWith("Bearer ")
        ? await this.jwt.verifyAsync<{ sub: string; sid: string }>(
            header.slice(7),
            { algorithms: ["HS256"], issuer: "myshop", audience: "myshop-api" },
          )
        : null;
      if (
        token &&
        (typeof token.sub !== "string" ||
          typeof token.sid !== "string" ||
          !/^[a-f\d-]{36}$/i.test(token.sub) ||
          !/^[a-f\d-]{36}$/i.test(token.sid))
      )
        throw new Error();
      if (!token && !/^[A-Za-z0-9_-]{40,200}$/.test(header.slice(8)))
        throw new Error();
      const session = await this.db.getRepository(Session).findOne({
        where: token
          ? { id: token.sid, userId: token.sub }
          : { refreshDigest: digest(header.slice(8)) },
        relations: { user: true },
      });
      if (
        !session ||
        session.revokedAt ||
        session.expiresAt < new Date() ||
        !session.user.active
      )
        throw new Error();
      req.user = session.user;
      req.sessionId = session.id;
    } catch {
      throw new UnauthorizedException(
        "Access token is expired, invalid or revoked",
      );
    }
    const permissions =
      this.reflector.getAllAndOverride<string[]>("permissions", [
        ctx.getHandler(),
        ctx.getClass(),
      ]) || [];
    if (permissions.includes("staff:manage") && req.user.role !== Role.ADMIN)
      throw new ForbiddenException("Only administrators may manage staff");
    if (
      permissions.length &&
      req.user.role !== Role.ADMIN &&
      (req.user.role !== Role.STAFF ||
        !permissions.every((p) => req.user.permissions.includes(p)))
    )
      throw new ForbiddenException("Required permission is missing");
    return true;
  }
}

/** Shared across all API instances. Fixed-window counters never keep raw IP/email. */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private db: DataSource,
    private reflector: Reflector,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>("skipRate", [
        ctx.getHandler(),
        ctx.getClass(),
      ])
    )
      return true;
    const req = ctx.switchToHttp().getRequest<Request>();
    const policy = this.reflector.getAllAndOverride<{
      limit: number;
      seconds: number;
    }>("rate", [ctx.getHandler(), ctx.getClass()]) || {
      limit: 180,
      seconds: 60,
    };
    const route = req.route?.path || req.path;
    const ipKey = digest(`${req.ip}:${route}`);
    const check = async (key: string, limit: number, seconds: number) => {
      const [row] = await this.db.query(
        `INSERT INTO rate_limits(key,hits,expires_at) VALUES ($1,1,now()+$2*interval '1 second')
        ON CONFLICT (key) DO UPDATE SET hits = CASE WHEN rate_limits.expires_at <= now() THEN 1 ELSE rate_limits.hits+1 END,
        expires_at = CASE WHEN rate_limits.expires_at <= now() THEN now()+$2*interval '1 second' ELSE rate_limits.expires_at END RETURNING hits,expires_at`,
        [key, seconds],
      );
      if (row.hits > limit) {
        ctx
          .switchToHttp()
          .getResponse()
          .setHeader(
            "Retry-After",
            Math.max(
              1,
              Math.ceil(
                (new Date(row.expires_at).getTime() - Date.now()) / 1000,
              ),
            ),
          );
        throw new HttpException("Too many requests. Try again later.", 429);
      }
    };
    await check(ipKey, policy.limit, policy.seconds);
    if (typeof req.body?.email === "string" && route.includes("auth"))
      await check(
        digest(`${route}:${req.body.email.trim().toLowerCase().slice(0, 254)}`),
        20,
        900,
      );
    return true;
  }
}
