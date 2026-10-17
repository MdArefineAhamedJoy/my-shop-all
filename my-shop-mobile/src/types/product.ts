export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  gender: "men" | "women" | "unisex";
  tags: string[];
  images: string[];
  sizes: string[];
  colors?: string[];
  stock: number;
  sku: string;
  rating?: number;
  reviewCount?: number;
  video?: string;
}
