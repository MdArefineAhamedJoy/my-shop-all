import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { DataSource, EntityManager } from "typeorm";
import { randomBytes } from "node:crypto";
import { Role, User } from "../users/entities/user.entity";
import { AuthToken, Session } from "./entities/session.entity";
import { ChangePasswordDto, LoginDto, RegisterDto } from "./dto/auth.dto";
import {
  decrypt,
  encrypt,
  hashPassword,
  newTotpSecret,
  verifyPassword,
  verifyTotp,
} from "./crypto";
import { digest } from "../../common/api";
import { PlatformService } from "../platform/platform.service";

@Injectable()
export class AuthService {
  private dummyHash = hashPassword(randomBytes(32).toString("hex"));
  constructor(
    private db: DataSource,
    private jwt: JwtService,
    private config: ConfigService,
    private platform: PlatformService,
  ) {}
  private get key() {
    return this.config.getOrThrow<string>("APP_ENCRYPTION_KEY");
  }
  profile(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      permissions: user.role === Role.ADMIN ? ["*"] : user.permissions,
      emailVerified: user.emailVerified,
      version: user.version,
    };
  }
  async register(input: RegisterDto, device: string) {
    const passwordHash = await hashPassword(input.password);
    return this.db.transaction(async (m) => {
      const user = await m.save(
        User,
        m.create(User, { email: input.email, name: input.name, passwordHash }),
      );
      await this.issueToken(m, user, "verify");
      return {
        user: this.profile(user),
        ...(await this.createSession(m, user, device)),
      };
    });
  }
  async login(input: LoginDto, device: string) {
    const user = await this.db
      .getRepository(User)
      .createQueryBuilder("u")
      .addSelect(["u.passwordHash", "u.mfaSecret", "u.mfaLastStep"])
      .where("u.email = :email", { email: input.email })
      .getOne();
    const valid = await verifyPassword(
      input.password,
      user?.passwordHash || (await this.dummyHash),
    );
    if (!user?.active || !valid)
      throw new UnauthorizedException(
        "Email, password or authenticator code is incorrect",
      );
    return this.db.transaction(async (m) => {
      const lockedUser = await m
        .getRepository(User)
        .createQueryBuilder("u")
        .addSelect(["u.passwordHash", "u.mfaSecret", "u.mfaLastStep"])
        .where("u.id = :id", { id: user.id })
        .setLock("pessimistic_write")
        .getOneOrFail();
      if (!lockedUser.active || lockedUser.passwordHash !== user.passwordHash)
        throw new UnauthorizedException("Credentials changed; sign in again");
      if (lockedUser.mfaSecret || lockedUser.role !== Role.CUSTOMER) {
        if (!lockedUser.mfaSecret || !input.mfaCode)
          throw new UnauthorizedException(
            "Authenticator code is required; contact an administrator if enrollment is incomplete",
          );
        const step = verifyTotp(
          decrypt(lockedUser.mfaSecret, this.key),
          input.mfaCode,
          lockedUser.mfaLastStep,
        );
        if (step === null)
          throw new UnauthorizedException(
            "Email, password or authenticator code is incorrect",
          );
        const result = await m
          .createQueryBuilder()
          .update(User)
          .set({ mfaLastStep: String(step) })
          .where(
            "id = :id AND (mfa_last_step IS NULL OR mfa_last_step < :step)",
            { id: user.id, step },
          )
          .execute();
        if (!result.affected)
          throw new UnauthorizedException(
            "Authenticator code was already used",
          );
      }
      return {
        user: this.profile(lockedUser),
        ...(await this.createSession(m, lockedUser, device)),
      };
    });
  }
  private async createSession(m: EntityManager, user: User, device: string) {
    await m.query(
      `UPDATE sessions SET revoked_at=now() WHERE id IN (SELECT id FROM sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at > now() ORDER BY created_at DESC,id DESC OFFSET 49)`,
      [user.id],
    );
    const refreshToken = randomBytes(48).toString("base64url");
    const session = await m.save(
      Session,
      m.create(Session, {
        userId: user.id,
        refreshDigest: digest(refreshToken),
        device: device.slice(0, 200),
        expiresAt: new Date(Date.now() + 30 * 86400000),
      }),
    );
    return {
      accessToken: await this.accessToken(user.id, session.id),
      refreshToken,
      expiresIn: 900,
      tokenType: "Bearer",
    };
  }
  private accessToken(userId: string, sessionId: string) {
    return this.jwt.signAsync(
      { sub: userId, sid: sessionId },
      {
        expiresIn: 900,
        algorithm: "HS256",
        issuer: "myshop",
        audience: "myshop-api",
      },
    );
  }
  async refresh(token: string) {
    return this.db.transaction(async (m) => {
      const session = await m
        .getRepository(Session)
        .createQueryBuilder("s")
        .where("s.refreshDigest = :digest", { digest: digest(token) })
        .setLock("pessimistic_write")
        .getOne();
      if (!session || session.revokedAt || session.expiresAt <= new Date())
        throw new UnauthorizedException(
          "Refresh token is expired, invalid or revoked",
        );
      const user = await m.findOneBy(User, {
        id: session.userId,
        active: true,
      });
      if (!user) throw new UnauthorizedException();
      const refreshToken = randomBytes(48).toString("base64url");
      session.refreshDigest = digest(refreshToken);
      await m.save(session);
      return {
        accessToken: await this.accessToken(user.id, session.id),
        refreshToken,
        expiresIn: 900,
        tokenType: "Bearer",
      };
    });
  }
  async revoke(userId: string, sessionId: string) {
    await this.db
      .getRepository(Session)
      .update({ id: sessionId, userId }, { revokedAt: new Date() });
    return { revoked: true };
  }
  async sessions(userId: string) {
    return this.db
      .getRepository(Session)
      .createQueryBuilder("s")
      .select(["s.id", "s.device", "s.createdAt", "s.expiresAt"])
      .where(
        "s.userId = :userId AND s.revokedAt IS NULL AND s.expiresAt > now()",
        { userId },
      )
      .orderBy("s.createdAt", "DESC")
      .take(50)
      .getMany();
  }
  private async issueToken(
    m: EntityManager,
    user: User,
    purpose: "verify" | "reset",
  ) {
    await m
      .createQueryBuilder()
      .update(AuthToken)
      .set({ usedAt: new Date() })
      .where("user_id = :id AND purpose = :purpose AND used_at IS NULL", {
        id: user.id,
        purpose,
      })
      .execute();
    const token = randomBytes(48).toString("base64url");
    await m.save(
      AuthToken,
      m.create(AuthToken, {
        userId: user.id,
        purpose,
        digest: digest(token),
        expiresAt: new Date(
          Date.now() + (purpose === "reset" ? 1800000 : 86400000),
        ),
      }),
    );
    // Tokens are encrypted at rest in the mail queue and never returned by public APIs.
    await this.platform.enqueue(m, "email", {
      to: user.email,
      subject:
        purpose === "reset"
          ? "Reset your MyShop password"
          : "Verify your MyShop email",
      encryptedText: encrypt(
        `${this.config.get<string>("STOREFRONT_URL") || "http://localhost:3000"}/${purpose === "reset" ? "recover" : "confirm?purpose=verify"}${purpose === "reset" ? "?" : "&"}token=${token}\n\nOne-time ${purpose} token for the mobile app or Swagger: ${token}\nExpires ${purpose === "reset" ? "in 30 minutes" : "in 24 hours"}.`,
        this.key,
      ),
    });
  }
  async requestReset(email: string) {
    const user = await this.db
      .getRepository(User)
      .findOneBy({ email, active: true });
    if (user)
      await this.db.transaction((m) => this.issueToken(m, user, "reset"));
    return { message: "If the address is eligible, an email will be sent." };
  }
  async verifyResetToken(token: string) {
    const entry = await this.db
      .getRepository(AuthToken)
      .createQueryBuilder("t")
      .where(
        "t.digest = :digest AND t.purpose = :purpose AND t.usedAt IS NULL AND t.expiresAt > now()",
        { digest: digest(token), purpose: "reset" },
      )
      .getOne();
    if (!entry) throw new BadRequestException("Token is invalid or expired");
    return { verified: true };
  }
  async requestVerification(user: User) {
    if (!user.emailVerified)
      await this.db.transaction((m) => this.issueToken(m, user, "verify"));
    return { message: "If the address is eligible, an email will be sent." };
  }
  async consumeToken(
    token: string,
    purpose: "reset" | "verify",
    password?: string,
  ) {
    const passwordHash = password ? await hashPassword(password) : undefined;
    return this.db.transaction(async (m) => {
      const entry = await m
        .getRepository(AuthToken)
        .createQueryBuilder("t")
        .where("t.digest = :digest AND t.purpose = :purpose", {
          digest: digest(token),
          purpose,
        })
        .setLock("pessimistic_write")
        .getOne();
      if (!entry || entry.usedAt || entry.expiresAt < new Date())
        throw new BadRequestException("Token is invalid or expired");
      entry.usedAt = new Date();
      await m.save(entry);
      if (purpose === "reset") {
        await m.update(User, entry.userId, { passwordHash });
        await m.update(
          Session,
          { userId: entry.userId },
          { revokedAt: new Date() },
        );
      } else await m.update(User, entry.userId, { emailVerified: true });
      return { completed: true };
    });
  }
  async changePassword(userId: string, input: ChangePasswordDto) {
    const user = await this.db
      .getRepository(User)
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.id = :id", { id: userId })
      .getOneOrFail();
    if (!(await verifyPassword(input.currentPassword, user.passwordHash)))
      throw new UnauthorizedException("Current password is incorrect");
    const passwordHash = await hashPassword(input.newPassword);
    await this.db.transaction(async (m) => {
      const result = await m
        .createQueryBuilder()
        .update(User)
        .set({ passwordHash })
        .where("id = :id AND password_hash = :old", {
          id: userId,
          old: user.passwordHash,
        })
        .execute();
      if (!result.affected)
        throw new ConflictException("Password changed concurrently");
      await m.update(Session, { userId }, { revokedAt: new Date() });
    });
    return { completed: true, signInAgain: true };
  }
  async beginMfa(userId: string, currentPassword: string) {
    const user = await this.db
      .getRepository(User)
      .createQueryBuilder("u")
      .addSelect(["u.passwordHash", "u.mfaSecret"])
      .where("u.id = :id", { id: userId })
      .getOneOrFail();
    if (!(await verifyPassword(currentPassword, user.passwordHash)))
      throw new UnauthorizedException();
    if (user.mfaSecret) throw new ConflictException("MFA is already enabled");
    const secret = newTotpSecret();
    const token = randomBytes(48).toString("base64url");
    await this.db.getRepository(AuthToken).save({
      userId,
      purpose: "mfa",
      digest: digest(token),
      secret: encrypt(secret, this.key),
      expiresAt: new Date(Date.now() + 600000),
    });
    return {
      token,
      secret,
      provisioningUri: `otpauth://totp/MyShop:${encodeURIComponent(user.email)}?secret=${secret}&issuer=MyShop`,
    };
  }
  async confirmMfa(userId: string, token: string, code: string) {
    return this.db.transaction(async (m) => {
      const user = await m
        .getRepository(User)
        .createQueryBuilder("u")
        .addSelect("u.mfaSecret")
        .where("u.id = :userId", { userId })
        .setLock("pessimistic_write")
        .getOneOrFail();
      if (user.mfaSecret) throw new ConflictException("MFA is already enabled");
      const entry = await m
        .getRepository(AuthToken)
        .createQueryBuilder("t")
        .addSelect("t.secret")
        .where(
          "t.digest = :digest AND t.userId = :userId AND t.purpose = :purpose",
          { digest: digest(token), userId, purpose: "mfa" },
        )
        .setLock("pessimistic_write")
        .getOne();
      if (!entry?.secret || entry.usedAt || entry.expiresAt < new Date())
        throw new BadRequestException("Enrollment expired");
      const step = verifyTotp(decrypt(entry.secret, this.key), code, null);
      if (step === null)
        throw new BadRequestException("Invalid authenticator code");
      await m.update(User, userId, {
        mfaSecret: entry.secret,
        mfaLastStep: String(step),
      });
      await m.update(AuthToken, entry.id, { usedAt: new Date(), secret: null });
      await m.update(Session, { userId }, { revokedAt: new Date() });
      return { enabled: true, signInAgain: true };
    });
  }
}
