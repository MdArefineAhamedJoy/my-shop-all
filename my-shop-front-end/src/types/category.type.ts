import { Product } from "./product.type";

export interface SubCategory {
  id: string;
  name: string;
  image: string;
  slug: string;
}

export interface CategoryLayoutProps {
  gender: "men" | "women";
  categoryName: string;
  products: Product[];
}
