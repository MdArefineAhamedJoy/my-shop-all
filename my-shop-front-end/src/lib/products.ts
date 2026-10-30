import type { Product } from "@/types/product.type";
import type { ApiProduct } from "./api";
export function productFromApi(p: ApiProduct): Product {
  const variants = p.variants.filter((v) => v.active);
  return {
    ...p,
    category: p.category?.slug || "",
    price: variants.length
      ? Math.min(...variants.map((v) => v.priceMinor)) / 100
      : 0,
    originalPrice: variants[0]?.compareAtMinor
      ? variants[0].compareAtMinor / 100
      : undefined,
    sizes: [...new Set(variants.map((v) => v.size))],
    colors: [...new Set(variants.map((v) => v.color))],
    stock: variants.reduce((sum, v) => sum + v.maxOrderQuantity, 0),
    sku: variants[0]?.sku || "",
    variants,
    tags: [
      ...p.tags,
      ...(p.isNew ? ["new-arrival"] : []),
      ...(variants.some(
        (v) => v.compareAtMinor && v.compareAtMinor > v.priceMinor,
      )
        ? ["sale"]
        : []),
    ],
  };
}
