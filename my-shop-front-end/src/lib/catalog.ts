import { useEffect, useState } from "react";
import type { Product } from "@/types/product.type";
import { productFromApi } from "./products";
import { apiPage, ApiProduct } from "./api";
interface Result {
  query: string;
  products: Product[];
  cursor: string | null;
  error: string;
  more: boolean;
}
export function useCatalog(filters: Record<string, string> = {}) {
  const query = new URLSearchParams({ limit: "100", ...filters }).toString();
  const [result, setResult] = useState<Result | null>(null);
  const current = result?.query === query ? result : null;
  useEffect(() => {
    let active = true;
    apiPage<ApiProduct[]>(`products?${query}`)
      .then((page) => {
        if (active)
          setResult({
            query,
            products: page.data.map(productFromApi),
            cursor: page.meta.nextCursor,
            error: "",
            more: false,
          });
      })
      .catch((e) => {
        if (active)
          setResult({
            query,
            products: [],
            cursor: null,
            error: e.message,
            more: false,
          });
      });
    return () => {
      active = false;
    };
  }, [query]);
  async function loadMore() {
    if (!current?.cursor || current.more) return;
    const cursor = current.cursor;
    setResult((r) => (r?.query === query ? { ...r, more: true } : r));
    try {
      const page = await apiPage<ApiProduct[]>(
        `products?${query}&cursor=${encodeURIComponent(cursor)}`,
      );
      setResult((r) =>
        r?.query === query && r.cursor === cursor
          ? {
              ...r,
              products: [...r.products, ...page.data.map(productFromApi)],
              cursor: page.meta.nextCursor,
              error: "",
            }
          : r,
      );
    } catch (e) {
      setResult((r) =>
        r?.query === query
          ? {
              ...r,
              error: e instanceof Error ? e.message : "Unable to load products",
            }
          : r,
      );
    } finally {
      setResult((r) => (r?.query === query ? { ...r, more: false } : r));
    }
  }
  return {
    products: current?.products || [],
    error: current?.error || "",
    loading: !current || current.more,
    hasMore: !!current?.cursor,
    loadMore,
  };
}
