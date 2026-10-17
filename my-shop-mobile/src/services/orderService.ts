import type { Address, CartItem, Order } from "@/types/shop";
import { totals } from "@/utils/commerce";

export function createPreviewOrder(
  items: CartItem[],
  address: Address,
  payment: string
): Order {
  return {
    id: `PREVIEW-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    items: items.map((item) => ({ ...item })),
    address: Object.fromEntries(
      Object.entries(address).map(([key, value]) => [key, value.trim()])
    ) as unknown as Address,
    payment,
    total: totals(items).total,
  };
}
