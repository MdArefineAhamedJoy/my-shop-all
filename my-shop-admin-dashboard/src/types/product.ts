export interface Product {
  id?: string;
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
  video?: string;
  isFeatured: boolean;
  isNew: boolean;
}

export type CreateProductRequest = Omit<Product, 'id'>;
