import { api, apiPage } from "./api";
import type { Product } from "@/types/product";
export interface Variant {
  id: string;
  sku: string;
  size: string;
  color: string;
  priceMinor: number;
  compareAtMinor: number | null;
  active: boolean;
  maxOrderQuantity: number;
}
export interface RemoteProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category?: { slug: string };
  gender: "men" | "women" | "unisex";
  tags: string[];
  images: string[];
  isNew: boolean;
  variants: Variant[];
}
export function productFromApi(p: RemoteProduct): Product {
  const variants = p.variants.filter((v) => v.active);
  return {
    ...p,
    category: p.category?.slug || "",
    tags: [...p.tags, ...(p.isNew ? ["new-arrival"] : [])],
    price: variants.length
      ? Math.min(...variants.map((v) => v.priceMinor)) / 100
      : 0,
    originalPrice: variants[0]?.compareAtMinor
      ? variants[0].compareAtMinor / 100
      : undefined,
    sizes: [...new Set(variants.map((v) => v.size))],
    colors: [...new Set(variants.map((v) => v.color))],
    stock: variants.reduce((sum, v) => sum + (v.maxOrderQuantity || 0), 0),
    sku: variants[0]?.sku || "",
    variants,
  };
}
export const catalogService = {
  async page(filters: Record<string, string>, cursor?: string) {
    const p = await apiPage<RemoteProduct[]>(
      `products?${new URLSearchParams({ limit: "40", ...filters, ...(cursor ? { cursor } : {}) })}`
    );
    return { ...p, data: p.data.map(productFromApi) };
  },
  async list() {
    return (await api<RemoteProduct[]>("products?limit=100")).map(
      productFromApi
    );
  },
  async detail(slug: string) {
    return productFromApi(
      await api<RemoteProduct>(`products/${encodeURIComponent(slug)}`)
    );
  },
};
