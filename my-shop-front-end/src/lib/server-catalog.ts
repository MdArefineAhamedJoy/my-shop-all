import "server-only";
import { ApiProduct } from "./api";
import { productFromApi } from "./products";
async function read(path: string) {
  const res = await fetch(
    `${process.env.API_INTERNAL_URL || "http://127.0.0.1:4000/v1"}/${path}`,
    { cache: "no-store", signal: AbortSignal.timeout(10000) },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("The catalog is unavailable. Please retry.");
  return (await res.json()).data;
}
export async function serverProducts(filters: Record<string, string> = {}) {
  const rows: ApiProduct[] = await read(
    `products?${new URLSearchParams({ limit: "100", ...filters })}`,
  );
  return rows.map(productFromApi);
}
export async function serverProduct(slug: string) {
  const row: ApiProduct | null = await read(
    `products/${encodeURIComponent(slug)}`,
  );
  return row ? productFromApi(row) : null;
}
