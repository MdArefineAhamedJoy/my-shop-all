import { ConflictException, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource, EntityManager } from "typeorm";
import { StoreSettings, SETTINGS_ID } from "./entities/settings.entity";
import { PlatformService } from "../platform/platform.service";
import type { SettingsDto } from "./settings.controller";
@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    private db: DataSource,
    private config: ConfigService,
    private platform: PlatformService,
  ) {}
  async onModuleInit() {
    // Environment provides initial defaults only. Later changes are persistent and audited.
    await this.db
      .getRepository(StoreSettings)
      .createQueryBuilder()
      .insert()
      .values({
        id: SETTINGS_ID,
        shippingMinor: this.config.getOrThrow("SHIPPING_MINOR"),
        freeShippingThresholdMinor: this.config.getOrThrow(
          "FREE_SHIPPING_THRESHOLD_MINOR",
        ),
        taxBasisPoints: this.config.getOrThrow("TAX_BASIS_POINTS"),
        returnWindowDays: this.config.getOrThrow("RETURN_WINDOW_DAYS"),
      })
      .orIgnore()
      .execute();
  }
  get(m: EntityManager = this.db.manager) {
    return m.findOneOrFail(StoreSettings, {
      where: { id: SETTINGS_ID },
      ...(m.queryRunner?.isTransactionActive
        ? { lock: { mode: "pessimistic_read" as const } }
        : {}),
    });
  }
  update(actorId: string, input: SettingsDto) {
    return this.db.transaction(async (m) => {
      const { expectedVersion, ...fields } = input;
      const result = await m.update(
        StoreSettings,
        { id: SETTINGS_ID, version: expectedVersion },
        fields,
      );
      if (!result.affected) throw new ConflictException("VERSION_CONFLICT");
      await this.platform.audit(
        m,
        actorId,
        "settings.update",
        SETTINGS_ID,
        fields,
      );
      return this.get(m);
    });
  }
}
