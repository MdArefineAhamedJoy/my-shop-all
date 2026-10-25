import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
export interface Storefront {
  announcement: string;
  banners: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    href: string;
  }[];
}
export function useStorefront() {
  return useQuery({
    queryKey: ["storefront"],
    queryFn: () => api<Storefront>("storefront"),
    staleTime: 30000,
  });
}
export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: () =>
      api<{ id: string; name: string; slug: string }[]>("collections"),
    staleTime: 30000,
  });
}
