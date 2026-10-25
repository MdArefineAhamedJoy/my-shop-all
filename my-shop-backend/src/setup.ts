import {
  BadRequestException,
  INestApplication,
  PayloadTooLargeException,
  RequestMethod,
  ValidationPipe,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ModulesContainer } from "@nestjs/core";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { ApiExceptionFilter, EnvelopeInterceptor } from "./common/api";

export function createOpenApi(app: INestApplication) {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("MyShop API")
      .setDescription(
        "BDT minor-unit pricing. Register/login, copy accessToken into Authorize, then try protected routes. Admin/staff login requires MFA. Mutating commerce commands require Idempotency-Key. Use expectedVersion from the latest resource. GET checkout/options lists configured payment methods. See README for the full test flow.",
      )
      .setVersion("1.0.0")
      .addBearerAuth()
      .build(),
  );
  // Keep the OpenAPI security contract aligned with the global guard, including
  // mixed controllers whose public routes inherit a class-level bearer annotation.
  for (const module of app.get(ModulesContainer).values()) {
    for (const wrapper of module.controllers.values()) {
      const controller = wrapper.metatype;
      if (!controller) continue;
      const base = Reflect.getMetadata(PATH_METADATA, controller) || "";
      for (const name of Object.getOwnPropertyNames(controller.prototype)) {
        const handler: unknown = (
          controller.prototype as Record<string, unknown>
        )[name];
        if (typeof handler !== "function") continue;
        const method = Reflect.getMetadata(METHOD_METADATA, handler);
        if (method === undefined) continue;
        const path =
          `/v1/${base}/${Reflect.getMetadata(PATH_METADATA, handler) || ""}`
            .replace(/\/+/g, "/")
            .replace(/\/$/, "")
            .replace(/:([^/]+)/g, "{$1}");
        const verb = RequestMethod[method].toLowerCase();
        const operation = document.paths[path]?.[verb as "get"];
        if (!operation) continue;
        if (
          Reflect.getMetadata("public", handler) ||
          Reflect.getMetadata("public", controller)
        )
          operation.security = [];
        const permissions =
          Reflect.getMetadata("permissions", handler) ||
          Reflect.getMetadata("permissions", controller);
        if (permissions?.length)
          operation.description =
            `${operation.description || ""}\nRequired server permissions: ${permissions.join(", ")} (administrators have all permissions).`.trim();
      }
    }
  }
  return document;
}
export function setupApp(app: INestApplication) {
  const config = app.get(ConfigService);
  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app
    .getHttpAdapter()
    .getInstance()
    .set("trust proxy", Number(config.get("TRUST_PROXY_HOPS")) || false);
  app.use(helmet());
  app.use(
    "/v1/payments/sslcommerz",
    urlencoded({ extended: false, limit: "32kb", parameterLimit: 100 }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.requestId = randomUUID();
    res.setHeader("X-Request-ID", req.requestId);
    next();
  });
  const parseJson = json({ limit: "256kb" });
  app.use((req: Request, res: Response, next: NextFunction) => {
    parseJson(req, res, (error) => {
      if (error?.type === "entity.parse.failed")
        return next(
          new BadRequestException({
            code: "INVALID_JSON",
            message: "Malformed JSON request body",
          }),
        );
      if (error?.type === "entity.too.large")
        return next(
          new PayloadTooLargeException({
            code: "BODY_TOO_LARGE",
            message: "Request body exceeds the allowed size",
          }),
        );
      next(error);
    });
  });
  const origins = config
    .getOrThrow<string>("CORS_ORIGINS")
    .split(",")
    .map((o) => o.trim());
  app.enableCors({
    origin: origins,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    exposedHeaders: ["X-Request-ID", "Retry-After"],
  });
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false, value: false },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  if (config.get("SWAGGER_ENABLED") === "true")
    SwaggerModule.setup("docs", app, createOpenApi(app), {
      jsonDocumentUrl: "docs-json",
      swaggerOptions: {
        persistAuthorization: false,
        displayRequestDuration: true,
      },
      customSiteTitle: "MyShop API Explorer",
    });
  app.enableShutdownHooks();
}
