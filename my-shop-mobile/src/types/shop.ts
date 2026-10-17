import type { Product } from "./product";

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}
export interface Filters {
  query?: string;
  gender?: string;
  category?: string;
  tag?: string;
  size?: string;
  min?: string;
  max?: string;
  sort?: string;
}
export interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}
export interface SavedAddress extends Address {
  id: string;
  label: string;
}
export interface Order {
  id: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  payment: string;
  address: Address;
}
export interface ShopState {
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  addresses: SavedAddress[];
  newsletter: string | null;
}
