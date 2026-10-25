import type { Product } from "./product";

export interface CartItem {
  variantId?: string;
  product: Product;
  size: string;
  color: string;
  quantity: number;
}
export interface Filters {
  collectionId?: string;
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
  version?: number;
  id: string;
  label: string;
}
export interface Order {
  totals?: {
    subtotalMinor: number;
    discountMinor: number;
    shippingMinor: number;
    taxMinor: number;
    totalMinor: number;
  };
  status?: string;
  paymentStatus?: string;
  version?: number;
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
