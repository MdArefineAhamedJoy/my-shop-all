import { useQuery } from "@tanstack/react-query";
import { catalogService } from "@/services/catalogService";

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog", "live"],
    queryFn: catalogService.list,
  });
}
