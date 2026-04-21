export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  sizes: string[];
  colors: string[];
  sortBy: "featured" | "price-asc" | "price-desc" | "newest";
}
