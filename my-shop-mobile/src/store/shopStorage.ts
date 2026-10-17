import { z } from "zod";
import type { ShopState } from "../types/shop";

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  price: z.number().nonnegative(),
  originalPrice: z.number().optional(),
  category: z.string(),
  gender: z.enum(["men", "women", "unisex"]),
  tags: z.array(z.string()),
  images: z.array(z.string()).min(1),
  sizes: z.array(z.string()).min(1),
  colors: z.array(z.string()).optional(),
  stock: z.number().int().nonnegative(),
  sku: z.string(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  video: z.string().optional(),
});
const itemSchema = z.object({
  product: productSchema,
  size: z.string(),
  color: z.string(),
  quantity: z.number().int().positive(),
});
const addressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
});
const schema = z.object({
  cart: z.array(itemSchema),
  wishlist: z.array(z.string()),
  orders: z.array(
    z.object({
      id: z.string(),
      createdAt: z.string(),
      items: z.array(itemSchema),
      total: z.number(),
      payment: z.string(),
      address: addressSchema,
    })
  ),
  addresses: z.array(
    addressSchema.extend({ id: z.string(), label: z.string() })
  ),
  newsletter: z.string().nullable(),
});
export function isShopState(value: unknown): value is ShopState {
  return schema.safeParse(value).success;
}
