import { Product } from "./product.type";

export interface CartItem {
  variantId?: string;
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
}
