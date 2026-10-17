import { MOCK_PRODUCTS } from "@/data/products";
import type { Product } from "@/types/product";

export interface CatalogService {
  list(): Promise<Product[]>;
}
export const catalogService: CatalogService = {
  async list() {
    return MOCK_PRODUCTS;
  },
};
