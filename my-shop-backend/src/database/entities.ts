import { User } from "../modules/users/entities/user.entity";
import { Address } from "../modules/users/entities/address.entity";
import { AuthToken, Session } from "../modules/auth/entities/session.entity";
import {
  Category,
  Product,
  Variant,
} from "../modules/catalog/entities/catalog.entity";
import {
  Inventory,
  InventoryMovement,
} from "../modules/inventory/entities/inventory.entity";
import { CartItem, WishlistItem } from "../modules/cart/entities/cart.entity";
import { Quote } from "../modules/checkout/entities/quote.entity";
import {
  Order,
  OrderEvent,
  OrderLine,
} from "../modules/orders/entities/order.entity";
import { Payment, Refund } from "../modules/payments/entities/payment.entity";
import { Promotion } from "../modules/promotions/entities/promotion.entity";
import { ReturnRequest } from "../modules/returns/entities/return.entity";
import {
  AuditLog,
  IdempotencyRecord,
  OutboxEvent,
  RateLimit,
} from "../modules/platform/entities/platform.entity";
import {
  Collection,
  NewsletterSubscription,
  StorefrontRevision,
} from "../modules/content/entities/content.entity";
import { StoreSettings } from "../modules/settings/entities/settings.entity";
import {
  GatewayAttempt,
  GatewayRefund,
} from "../modules/payments/entities/gateway.entity";

export const entities = [
  User,
  Address,
  Session,
  AuthToken,
  Category,
  Product,
  Variant,
  Inventory,
  InventoryMovement,
  CartItem,
  WishlistItem,
  Quote,
  Order,
  OrderLine,
  OrderEvent,
  Payment,
  Refund,
  Promotion,
  ReturnRequest,
  AuditLog,
  IdempotencyRecord,
  OutboxEvent,
  RateLimit,
  Collection,
  NewsletterSubscription,
  StorefrontRevision,
  StoreSettings,
  GatewayAttempt,
  GatewayRefund,
];
