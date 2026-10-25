import { addressSchema } from "../schemas/addressSchema";
import type { Address, CartItem, Filters } from "../types/shop";
import type { Product } from "../types/product";

export const cartKey = (item: Pick<CartItem, "product" | "size" | "color">) =>
  JSON.stringify([item.product.id, item.size, item.color]);
export const money = (value: number) =>
  `৳${value.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
export function totals(cart: CartItem[]) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const tax = 0; // The checkout quote supplies the actual tax and delivery charges.
  return { subtotal, tax, total: subtotal + tax };
}
export function filterProducts(products: Product[], f: Filters): Product[] {
  const result = products.filter(
    (p) =>
      (!f.query ||
        `${p.name} ${p.description} ${p.category}`
          .toLowerCase()
          .includes(f.query.trim().toLowerCase())) &&
      (!f.gender || p.gender === f.gender || p.gender === "unisex") &&
      (!f.category || p.category === f.category) &&
      (!f.tag ||
        (f.tag === "sale"
          ? !!p.originalPrice && p.originalPrice > p.price
          : p.tags.includes(f.tag))) &&
      (!f.size || p.sizes.includes(f.size)) &&
      (!f.min || p.price >= Number(f.min)) &&
      (!f.max || p.price <= Number(f.max))
  );
  return result.sort((a, b) => {
    switch (f.sort) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "best-selling":
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      case "newest":
        return Number(b.id) - Number(a.id);
      case "oldest":
        return Number(a.id) - Number(b.id);
      default:
        return 0;
    }
  });
}
export function validateAddress(address: Address): string | null {
  const result = addressSchema.safeParse(address);
  return result.success
    ? null
    : result.error.issues[0]?.message || "Please check your delivery details.";
}
