import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { createTransport, Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { OutboxEvent } from "./entities/platform.entity";
import { Order } from "../orders/entities/order.entity";
import { User } from "../users/entities/user.entity";
import { decrypt } from "../auth/crypto";

/** Leased, at-least-once outbox. External I/O happens after the claim commits. */
@Injectable()
export class OutboxWorker implements OnModuleInit, OnApplicationShutdown {
  private logger = new Logger(OutboxWorker.name);
  private timer?: NodeJS.Timeout;
  private task: Promise<void> | null = null;
  private transport?: Transporter;
  private cleanupAt = 0;
  constructor(
    private db: DataSource,
    private config: ConfigService,
  ) {}
  onModuleInit() {
    if (this.config.get("WORKER_ENABLED") === "false") return;
    const url = this.config.get<string>("SMTP_URL");
    if (url)
      this.transport = createTransport({
        url,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
        disableFileAccess: true,
        disableUrlAccess: true,
      } as SMTPTransport.Options);
    this.timer = setInterval(() => {
      if (!this.task)
        this.task = this.tick()
          .catch(() => this.logger.error("Outbox tick failed"))
          .finally(() => {
            this.task = null;
          });
    }, 2000);
    this.timer.unref();
  }
  async onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
    await this.task;
    this.transport?.close();
  }
  private async tick() {
    if (Date.now() > this.cleanupAt) {
      await this.db.query(
        "DELETE FROM rate_limits WHERE expires_at < now() - interval '1 hour'",
      );
      // Keep completed idempotency results for at least 7 days.
      await this.db.query(
        "DELETE FROM idempotency_records WHERE created_at < now() - interval '7 days'",
      );
      await this.db.query(
        "DELETE FROM auth_tokens WHERE expires_at < now() - interval '7 days'",
      );
      await this.db.query(
        "DELETE FROM sessions WHERE expires_at < now() - interval '7 days'",
      );
      this.cleanupAt = Date.now() + 3600000;
    }
    if (!this.transport) return;
    const rows: { id: string }[] = await this.db.query(`WITH due AS (
      SELECT id FROM outbox_events WHERE (status='pending' AND available_at <= now()) OR (status='processing' AND lease_until < now()) ORDER BY available_at LIMIT 5 FOR UPDATE SKIP LOCKED
    ), claimed AS (UPDATE outbox_events e SET status='processing', lease_until=now()+interval '2 minutes', attempts=attempts+1 FROM due WHERE e.id=due.id RETURNING e.id) SELECT id FROM claimed`);
    for (const row of rows) {
      const event = await this.db
        .getRepository(OutboxEvent)
        .createQueryBuilder("e")
        .addSelect("e.payload")
        .where("e.id = :id", { id: row.id })
        .getOneOrFail();
      try {
        let to: string;
        let subject: string;
        let text: string;
        if (event.type === "email") {
          to = String(event.payload.to);
          subject = String(event.payload.subject);
          text = decrypt(
            String(event.payload.encryptedText),
            this.config.getOrThrow("APP_ENCRYPTION_KEY"),
          );
        } else if (event.type === "order.placed") {
          const order = await this.db
            .getRepository(Order)
            .findOneByOrFail({ id: String(event.payload.orderId) });
          const user = await this.db
            .getRepository(User)
            .findOneByOrFail({ id: order.userId });
          to = user.email;
          subject = `Your order ${order.orderNumber}`;
          text = `Your COD order is confirmed. Total: BDT ${(order.totalMinor / 100).toFixed(2)}. Track it in your MyShop account.`;
        } else throw new Error("Unknown event type");
        await this.transport.sendMail({
          to,
          from: this.config.get("MAIL_FROM") || "MyShop <shop@localhost>",
          subject,
          text,
          messageId: `<${event.id}@myshop>`,
        });
        await this.db.getRepository(OutboxEvent).update(event.id, {
          status: "sent",
          leaseUntil: null,
          payload: {},
          lastError: null,
        });
      } catch {
        await this.db.getRepository(OutboxEvent).update(event.id, {
          status: event.attempts >= 8 ? "failed" : "pending",
          leaseUntil: null,
          availableAt: new Date(
            Date.now() + Math.min(3600000, 1000 * 2 ** event.attempts),
          ),
          lastError: "DELIVERY_FAILED",
        });
        this.logger.warn(
          `Delivery failed for event ${event.id}; attempt ${event.attempts}`,
        );
      }
    }
  }
}
