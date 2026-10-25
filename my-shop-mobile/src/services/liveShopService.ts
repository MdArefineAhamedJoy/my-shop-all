import type { Address, CartItem, Order, SavedAddress } from "@/types/shop";
import type { UserProfile } from "@/types/auth";
import { api } from "./api";
import { productFromApi, RemoteProduct, Variant } from "./liveCatalogService";
export interface RemoteOrder {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalMinor: number;
  version: number;
  totals: NonNullable<Order["totals"]>;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    city: string;
    postalCode: string;
  };
  lines: {
    id: string;
    variantId: string;
    name: string;
    sku: string;
    size: string;
    color: string;
    quantity: number;
    unitPriceMinor: number;
  }[];
}
export const addressToApi = (a: Address) => ({
  name: `${a.firstName} ${a.lastName}`.trim(),
  phone: a.phone,
  line1: a.address,
  city: a.city,
  region: a.city,
  postalCode: a.postalCode,
  countryCode: "BD",
});
export function orderFromApi(o: RemoteOrder, email: string): Order {
  return {
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    paymentStatus: o.paymentStatus,
    version: o.version,
    payment: o.paymentMethod,
    total: o.totalMinor / 100,
    totals: o.totals,
    address: {
      firstName: o.shippingAddress.name.split(" ")[0],
      lastName: o.shippingAddress.name.split(" ").slice(1).join(" "),
      email,
      phone: o.shippingAddress.phone,
      address: o.shippingAddress.line1,
      city: o.shippingAddress.city,
      postalCode: o.shippingAddress.postalCode,
    },
    items: o.lines.map((l) => ({
      variantId: l.variantId,
      size: l.size,
      color: l.color,
      quantity: l.quantity,
      product: {
        id: l.variantId,
        name: l.name,
        slug: "",
        description: "",
        price: l.unitPriceMinor / 100,
        category: "",
        gender: "unisex",
        images: [],
        tags: [],
        sizes: [l.size],
        colors: [l.color],
        stock: l.quantity,
        sku: l.sku,
      },
    })),
  };
}
export async function loadShop(user: UserProfile) {
  const [cart, wishlist, orders, addresses] = await Promise.all([
    api<{
      items: {
        variantId: string;
        quantity: number;
        variant: Variant & { product: RemoteProduct };
      }[];
    }>("cart"),
    api<{ productId: string }[]>("me/wishlist?limit=100"),
    api<RemoteOrder[]>("me/orders?limit=100"),
    api<
      {
        id: string;
        label: string;
        version: number;
        details: {
          name: string;
          phone: string;
          line1: string;
          city: string;
          postalCode: string;
        };
      }[]
    >("me/addresses"),
  ]);
  return {
    cart: cart.items.map((i) => ({
      variantId: i.variantId,
      product: productFromApi({
        ...i.variant.product,
        variants: [{ ...i.variant, maxOrderQuantity: 99 }],
      }),
      size: i.variant.size,
      color: i.variant.color,
      quantity: i.quantity,
    })) as CartItem[],
    wishlist: wishlist.map((i) => i.productId),
    orders: orders.map((o) => orderFromApi(o, user.email)),
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label,
      version: a.version,
      firstName: a.details.name.split(" ")[0],
      lastName: a.details.name.split(" ").slice(1).join(" "),
      email: user.email,
      phone: a.details.phone,
      address: a.details.line1,
      city: a.details.city,
      postalCode: a.details.postalCode,
    })) as SavedAddress[],
    newsletter: null,
  };
}
