import { api } from "./api";
import { addressToApi, orderFromApi, RemoteOrder } from "./liveShopService";
import type { Address } from "@/types/shop";
export interface CheckoutQuote {
  id: string;
  paymentMethod: string;
  totals: {
    subtotalMinor: number;
    discountMinor: number;
    shippingMinor: number;
    taxMinor: number;
    totalMinor: number;
  };
}
export function quoteOrder(address: Address, payment: string) {
  return api<CheckoutQuote>("checkout/quotes", {
    method: "POST",
    body: JSON.stringify({
      shippingAddress: addressToApi(address),
      paymentMethod: payment,
    }),
  });
}
export async function placeOrder(quoteId: string, key: string, email: string) {
  return orderFromApi(
    await api<RemoteOrder>("orders", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify({ quoteId }),
    }).then((o) => api<RemoteOrder>(`orders/${o.id}`)),
    email
  );
}
