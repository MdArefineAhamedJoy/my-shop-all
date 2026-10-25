import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import {
  AuditLog,
  IdempotencyRecord,
  OutboxEvent,
} from "./entities/platform.entity";
import { canonical, digest } from "../../common/api";

@Injectable()
export class PlatformService {
  constructor(private db: DataSource) {}
  audit(
    manager: EntityManager,
    actorId: string,
    action: string,
    entityId: string,
    details: Record<string, unknown> = {},
  ) {
    return manager.save(
      AuditLog,
      manager.create(AuditLog, { actorId, action, entityId, details }),
    );
  }
  enqueue(
    manager: EntityManager,
    type: string,
    payload: Record<string, unknown>,
  ) {
    return manager.save(
      OutboxEvent,
      manager.create(OutboxEvent, { type, payload }),
    );
  }
  async command<T>(
    scope: string,
    key: string | undefined,
    input: unknown,
    action: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    if (!key || !/^[\x21-\x7e]{8,128}$/.test(key))
      throw new BadRequestException(
        "Idempotency-Key header must contain 8–128 printable non-space characters",
      );
    const hash = digest(canonical(input));
    return this.db.transaction(async (manager) => {
      // Transaction advisory lock serializes retries before reading the durable result.
      await manager.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        [`${scope}:${key}`],
      );
      const existing = await manager.findOneBy(IdempotencyRecord, {
        scope,
        key,
      });
      if (existing) {
        if (existing.requestHash !== hash)
          throw new ConflictException(
            "IDEMPOTENCY_CONFLICT: key was used with a different request",
          );
        return existing.response as T;
      }
      const result = await action(manager);
      await manager.save(
        IdempotencyRecord,
        manager.create(IdempotencyRecord, {
          scope,
          key,
          requestHash: hash,
          response: JSON.parse(JSON.stringify(result)),
        }),
      );
      return result;
    });
  }
}
