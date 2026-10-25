import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Role, User } from "./entities/user.entity";
import { Address } from "./entities/address.entity";
import {
  AddressDto,
  CreateStaffDto,
  ProfileDto,
  StaffPermissionsDto,
} from "./dto/user.dto";
import { PageQuery, paginate } from "../../common/api";
import { PlatformService } from "../platform/platform.service";
import { AuthService } from "../auth/auth.service";
import { encrypt, hashPassword, newTotpSecret } from "../auth/crypto";
import { ConfigService } from "@nestjs/config";
import { Session } from "../auth/entities/session.entity";

@Injectable()
export class UsersService {
  constructor(
    private db: DataSource,
    private auth: AuthService,
    private platform: PlatformService,
    private config: ConfigService,
  ) {}
  async profile(id: string, input: ProfileDto) {
    const { expectedVersion, ...fields } = input;
    const result = await this.db
      .getRepository(User)
      .update({ id, version: expectedVersion }, fields);
    if (!result.affected) throw new ConflictException("VERSION_CONFLICT");
    return this.auth.profile(
      await this.db.getRepository(User).findOneByOrFail({ id }),
    );
  }
  addresses(userId: string) {
    return this.db
      .getRepository(Address)
      .find({ where: { userId }, order: { createdAt: "DESC" }, take: 30 });
  }
  async address(
    userId: string,
    input: AddressDto,
    id?: string,
    expectedVersion?: number,
  ) {
    return this.db.transaction(async (m) => {
      await m.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
        `addresses:${userId}`,
      ]);
      let row = id ? await m.findOneBy(Address, { id, userId }) : null;
      if (id && !row) throw new NotFoundException();
      if (row && row.version !== expectedVersion)
        throw new ConflictException("VERSION_CONFLICT");
      if (!id && (await m.countBy(Address, { userId })) >= 30)
        throw new ConflictException("Address limit reached");
      if (input.isDefault)
        await m.update(
          Address,
          { userId, isDefault: true },
          { isDefault: false },
        );
      row = m.create(Address, { ...(row || {}), ...input, userId });
      return m.save(row);
    });
  }
  async removeAddress(userId: string, id: string) {
    const result = await this.db.getRepository(Address).delete({ id, userId });
    if (!result.affected) throw new NotFoundException();
    return { deleted: true };
  }
  customers(query: PageQuery) {
    return paginate(
      this.db
        .getRepository(User)
        .createQueryBuilder("u")
        .select([
          "u.id",
          "u.createdAt",
          "u.name",
          "u.email",
          "u.phone",
          "u.active",
          "u.version",
        ])
        .where("u.role = :role", { role: Role.CUSTOMER }),
      query,
      "customers",
    );
  }
  async customer(id: string) {
    const user = await this.db
      .getRepository(User)
      .findOneBy({ id, role: Role.CUSTOMER });
    if (!user) throw new NotFoundException();
    return this.auth.profile(user);
  }
  async staff() {
    const rows = await this.db
      .getRepository(User)
      .createQueryBuilder("u")
      .where("u.role IN (:...roles)", { roles: [Role.STAFF, Role.ADMIN] })
      .orderBy("u.createdAt", "DESC")
      .take(100)
      .getMany();
    return rows.map((row) => this.auth.profile(row));
  }
  async createStaff(actorId: string, input: CreateStaffDto) {
    const secret = newTotpSecret();
    const passwordHash = await hashPassword(input.password);
    return this.db.transaction(async (m) => {
      const row = await m.save(
        User,
        m.create(User, {
          email: input.email,
          name: input.name,
          passwordHash,
          role: Role.STAFF,
          permissions: input.permissions,
          mfaSecret: encrypt(
            secret,
            this.config.getOrThrow("APP_ENCRYPTION_KEY"),
          ),
        }),
      );
      await this.platform.audit(m, actorId, "staff.create", row.id, {
        permissions: input.permissions,
      });
      return {
        user: this.auth.profile(row),
        provisioningUri: `otpauth://totp/MyShop:${encodeURIComponent(row.email)}?secret=${secret}&issuer=MyShop`,
        message:
          "Share this enrollment URI privately once; it cannot be retrieved later.",
      };
    });
  }
  async staffPermissions(
    actorId: string,
    id: string,
    input: StaffPermissionsDto,
  ) {
    return this.db.transaction(async (m) => {
      const result = await m.update(
        User,
        { id, role: Role.STAFF, version: input.expectedVersion },
        { permissions: input.permissions },
      );
      if (!result.affected)
        throw new ConflictException("Staff missing or VERSION_CONFLICT");
      await m.update(Session, { userId: id }, { revokedAt: new Date() });
      await this.platform.audit(m, actorId, "staff.permissions", id, {
        permissions: input.permissions,
      });
      return this.auth.profile(await m.findOneByOrFail(User, { id }));
    });
  }
  async disable(actorId: string, id: string) {
    if (actorId === id)
      throw new ForbiddenException("Cannot disable your own account");
    return this.db.transaction(async (m) => {
      const row = await m.findOneBy(User, { id });
      if (!row) throw new NotFoundException();
      if (row.role === Role.ADMIN)
        throw new ForbiddenException(
          "Administrators cannot be disabled through this endpoint",
        );
      await m.update(User, id, { active: false });
      await m.update(Session, { userId: id }, { revokedAt: new Date() });
      await this.platform.audit(m, actorId, "user.disable", id);
      return { disabled: true };
    });
  }
}
