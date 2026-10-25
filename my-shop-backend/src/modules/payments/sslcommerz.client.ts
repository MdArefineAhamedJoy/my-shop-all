import {
  Injectable,
  ServiceUnavailableException,
  BadGatewayException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export function decimalMinor(value: unknown): number {
  const text = String(value);
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text))
    throw new BadGatewayException("Invalid provider amount");
  const [whole, fraction = ""] = text.split(".");
  const minor = Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")));
  if (!Number.isSafeInteger(minor))
    throw new BadGatewayException("Invalid provider amount");
  return minor;
}
export const gatewayEnabled = (config: ConfigService) =>
  Boolean(
    config.get("SSLCOMMERZ_STORE_ID") &&
    config.get("SSLCOMMERZ_STORE_PASSWORD"),
  );

@Injectable()
export class SslcommerzClient {
  constructor(private config: ConfigService) {}
  get enabled() {
    return gatewayEnabled(this.config);
  }
  get base() {
    return this.config.get("SSLCOMMERZ_SANDBOX") === "false"
      ? "https://securepay.sslcommerz.com"
      : "https://sandbox.sslcommerz.com";
  }
  private async request(
    path: string,
    values: Record<string, string>,
    post = false,
  ): Promise<Record<string, any>> {
    if (!this.enabled)
      throw new ServiceUnavailableException("Online payment is not configured");
    const body = new URLSearchParams({
      ...values,
      store_id: this.config.getOrThrow("SSLCOMMERZ_STORE_ID"),
      store_passwd: this.config.getOrThrow("SSLCOMMERZ_STORE_PASSWORD"),
      format: "json",
    });
    try {
      const response = await fetch(
        `${this.base}${path}${post ? "" : `?${body}`}`,
        {
          method: post ? "POST" : "GET",
          ...(post ? { body } : {}),
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (!result || typeof result !== "object" || Array.isArray(result))
        throw new Error();
      return result;
    } catch {
      throw new BadGatewayException(
        "Payment provider did not return a valid response; reconcile before retrying",
      );
    }
  }
  async initialize(values: Record<string, string>) {
    const result = await this.request("/gwprocess/v4/api.php", values, true);
    if (
      result.status !== "SUCCESS" ||
      typeof result.GatewayPageURL !== "string"
    )
      throw new BadGatewayException(
        "Provider declined initialization; reconciliation is required",
      );
    const url = new URL(result.GatewayPageURL);
    if (url.origin !== this.base || url.username || url.password)
      throw new BadGatewayException("Invalid provider checkout URL");
    return url.href;
  }
  validate(value: string) {
    return this.request("/validator/api/validationserverAPI.php", {
      val_id: value,
    });
  }
  query(transactionId: string) {
    return this.request("/validator/api/merchantTransIDvalidationAPI.php", {
      tran_id: transactionId,
    });
  }
  refund(values: Record<string, string>) {
    return this.request("/validator/api/merchantTransIDvalidationAPI.php", {
      ...values,
      v: "1",
    });
  }
  refundStatus(reference: string) {
    return this.request("/validator/api/merchantTransIDvalidationAPI.php", {
      refund_ref_id: reference,
    });
  }
}
