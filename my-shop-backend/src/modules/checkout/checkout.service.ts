import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { CartItem } from "../cart/entities/cart.entity";
import { lockCart } from "../cart/cart.service";
import {
  CreateQuoteDto,
  ManualItemDto,
  ManualQuoteDto,
} from "./dto/checkout.dto";
import { Quote, QuoteLine, Totals } from "./entities/quote.entity";
import { Promotion } from "../promotions/entities/promotion.entity";
import { Inventory } from "../inventory/entities/inventory.entity";
import { canonical, digest } from "../../common/api";
import { SettingsService } from "../settings/settings.service";
import { Role, User } from "../users/entities/user.entity";
import { Variant } from "../catalog/entities/catalog.entity";
import { ConfigService } from "@nestjs/config";
import { gatewayEnabled } from "../payments/sslcommerz.client";

export const cartHash = (items: { variantId: string; quantity: number }[]) =>
  digest(
    canonical(
      items
        .map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
        .sort((a, b) => a.variantId.localeCompare(b.variantId)),
    ),
  );
export function calculateTotals(
  subtotal: number,
  percent: number,
  shipping: number,
  freeThreshold: number,
  basisPoints: number,
): Totals {
  const discountMinor = Math.floor((subtotal * percent) / 100);
  const taxable = subtotal - discountMinor;
  const shippingMinor = taxable >= freeThreshold ? 0 : shipping;
  const taxMinor = Math.round((taxable * basisPoints) / 10000);
  const totalMinor = taxable + shippingMinor + taxMinor;
  if (
    !Number.isSafeInteger(totalMinor) ||
    totalMinor <= 0 ||
    totalMinor > 1000000000
  )
    throw new BadRequestException("Order total is outside the allowed range");
  return {
    subtotalMinor: subtotal,
    discountMinor,
    shippingMinor,
    taxMinor,
    totalMinor,
  };
}

@Injectable()
export class CheckoutService {
  constructor(
    private db: DataSource,
    private settings: SettingsService,
    private config: ConfigService,
  ) {}
  async options() {
    const policy = await this.settings.get();
    return {
      currency: "BDT",
      paymentMethods: gatewayEnabled(this.config)
        ? ["cod", "sslcommerz"]
        : ["cod"],
      countries: ["BD"],
      shippingMinor: policy.shippingMinor,
      freeShippingThresholdMinor: policy.freeShippingThresholdMinor,
      taxBasisPoints: policy.taxBasisPoints,
      quoteTtlSeconds: 300,
      authenticationRequired: true,
      policyVersion: policy.version,
    };
  }
  async cartLines(m: EntityManager, userId: string) {
    const items = await m.find(CartItem, {
      where: { userId },
      order: { variantId: "ASC" },
      take: 101,
    });
    return { items, lines: await this.resolveLines(m, items) };
  }
  async resolveLines(m: EntityManager, items: ManualItemDto[]) {
    if (!items.length || items.length > 100)
      throw new BadRequestException(
        "Cart must contain between 1 and 100 variants",
      );
    const variants = await m.find(Variant, {
      where: { id: In(items.map((item) => item.variantId)) },
      relations: { product: { category: true } },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const stocks = await m.findBy(Inventory, {
      variantId: In(items.map((item) => item.variantId)),
    });
    const stockMap = new Map(
      stocks.map((stock) => [stock.variantId, stock.available]),
    );
    const lines: QuoteLine[] = [];
    for (const item of items) {
      const v = variantMap.get(item.variantId);
      if (
        !v?.active ||
        v.product.status !== "published" ||
        !v.product.category.active
      )
        throw new ConflictException("A product is no longer available");
      if ((stockMap.get(v.id) || 0) < item.quantity)
        throw new ConflictException(`OUT_OF_STOCK: ${v.sku}`);
      lines.push({
        variantId: v.id,
        productId: v.productId,
        name: v.product.name,
        sku: v.sku,
        size: v.size,
        color: v.color,
        quantity: item.quantity,
        unitPriceMinor: v.priceMinor,
      });
    }
    return lines;
  }
  async quote(userId: string, input: CreateQuoteDto) {
    return this.db.transaction(async (m) => {
      await lockCart(m, userId);
      const { items, lines } = await this.cartLines(m, userId);
      return this.priceQuote(m, userId, items, lines, input);
    });
  }
  async manualQuote(actorId: string, input: ManualQuoteDto) {
    return this.db.transaction(async (m) => {
      if (
        !(await m.existsBy(User, {
          id: input.customerId,
          role: Role.CUSTOMER,
          active: true,
        }))
      )
        throw new BadRequestException("An active customer account is required");
      const lines = await this.resolveLines(m, input.items);
      return this.priceQuote(
        m,
        input.customerId,
        input.items,
        lines,
        input,
        actorId,
      );
    });
  }
  private async priceQuote(
    m: EntityManager,
    userId: string,
    items: ManualItemDto[],
    lines: QuoteLine[],
    input: CreateQuoteDto,
    actorId?: string,
  ) {
    const subtotal = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPriceMinor,
      0,
    );
    let promotion: Promotion | null = null;
    if (input.promotionCode) {
      promotion = await m.findOneBy(Promotion, {
        code: input.promotionCode.trim().toUpperCase(),
        active: true,
      });
      if (
        !promotion ||
        promotion.startsAt > new Date() ||
        promotion.endsAt <= new Date() ||
        promotion.usedCount >= promotion.maxUses ||
        subtotal < promotion.minimumMinor
      )
        throw new ConflictException(
          "Promotion is unavailable or minimum spend was not reached",
        );
    }
    const policy = await this.settings.get(m);
    if (input.paymentMethod === "sslcommerz" && !gatewayEnabled(this.config))
      throw new BadRequestException("Online payment is not configured");
    const totals = calculateTotals(
      subtotal,
      promotion?.percent || 0,
      policy.shippingMinor,
      policy.freeShippingThresholdMinor,
      policy.taxBasisPoints,
    );
    if (
      input.paymentMethod === "sslcommerz" &&
      (totals.totalMinor < 1000 || totals.totalMinor > 50000000)
    )
      throw new BadRequestException(
        "Online payment amount must be between BDT 10 and 500000",
      );
    return m.save(
      Quote,
      m.create(Quote, {
        userId,
        lines,
        totals,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
        promotionId: promotion?.id || null,
        expiresAt: new Date(Date.now() + 300000),
        cartHash: cartHash(items),
        policyVersion: policy.version,
        createdById: actorId || null,
      }),
    );
  }
}
