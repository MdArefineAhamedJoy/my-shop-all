import { useInfiniteQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/catalogService";
import type { Filters } from "@/types/shop";
export function useCatalogPages(filters: Filters) {
  const values: Record<string, string> = {};
  if (filters.query?.trim()) values.q = filters.query.trim();
  if (filters.collectionId) values.collectionId = filters.collectionId;
  for (const key of ["gender", "category", "tag", "size"] as const)
    if (filters[key]) values[key] = filters[key]!;
  if (filters.min)
    values.minPriceMinor = String(Math.round(Number(filters.min) * 100));
  if (filters.max)
    values.maxPriceMinor = String(Math.round(Number(filters.max) * 100));
  const query = useInfiniteQuery({
    queryKey: ["catalog-pages", values],
    queryFn: ({ pageParam }) => catalogService.page(values, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.meta.nextCursor || undefined,
  });
  return { ...query, data: query.data?.pages.flatMap((p) => p.data) || [] };
}
