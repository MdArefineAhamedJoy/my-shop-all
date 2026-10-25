export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return (await apiPage<T>(path, options)).data;
}
export async function apiPage<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta: { hasMore: boolean; nextCursor: string | null } }> {
  const response = await fetch(`/api/v1/${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(
      result.error?.message || "Request failed",
      response.status,
    );
  return result;
}
export interface ApiVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  priceMinor: number;
  compareAtMinor: number | null;
  maxOrderQuantity: number;
  active: boolean;
}
export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: { name: string; slug: string };
  gender: "men" | "women" | "unisex";
  images: string[];
  tags: string[];
  isNew: boolean;
  isFeatured: boolean;
  variants: ApiVariant[];
  version: number;
  status: string;
}
