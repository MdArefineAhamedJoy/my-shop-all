import type { CartItem, Order, SavedAddress, ShopState } from "../types/shop";
import type { Product } from "../types/product";
import { cartKey } from "../utils/commerce";

export const initialState: ShopState = {
  cart: [],
  wishlist: [],
  orders: [],
  addresses: [],
  newsletter: null,
};
export type Action =
  | { type: "hydrate"; state: ShopState }
  | {
      type: "add";
      product: Product;
      size: string;
      color: string;
      quantity: number;
    }
  | { type: "quantity"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "wishlist"; id: string }
  | { type: "order"; order: Order }
  | { type: "save-address"; address: SavedAddress }
  | { type: "delete-address"; id: string }
  | { type: "newsletter"; email: string };

export function reducer(state: ShopState, action: Action): ShopState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "add": {
      const { product, size, color } = action;
      if (
        product.stock <= 0 ||
        !product.sizes.includes(size) ||
        (product.colors?.length && !product.colors.includes(color))
      )
        return state;
      const incoming: CartItem = {
        product,
        size,
        color,
        quantity: Math.max(1, Math.floor(action.quantity) || 1),
      };
      const key = cartKey(incoming);
      // Stock is shared across every size/color of a product in this mock catalog.
      const reserved = state.cart
        .filter((i) => i.product.id === product.id)
        .reduce((sum, i) => sum + i.quantity, 0);
      const available = Math.max(0, product.stock - reserved);
      if (!available) return state;
      incoming.quantity = Math.min(incoming.quantity, available);
      const existing = state.cart.find((i) => cartKey(i) === key);
      return {
        ...state,
        cart: existing
          ? state.cart.map((i) =>
              cartKey(i) === key
                ? { ...i, quantity: i.quantity + incoming.quantity }
                : i
            )
          : [...state.cart, incoming],
      };
    }
    case "quantity":
      return {
        ...state,
        cart: state.cart.map((i) => {
          if (cartKey(i) !== action.key) return i;
          const others = state.cart
            .filter(
              (j) => j.product.id === i.product.id && cartKey(j) !== action.key
            )
            .reduce((sum, j) => sum + j.quantity, 0);
          return {
            ...i,
            quantity: Math.max(
              1,
              Math.min(
                i.product.stock - others,
                Math.floor(action.quantity) || 1
              )
            ),
          };
        }),
      };
    case "remove":
      return {
        ...state,
        cart: state.cart.filter((i) => cartKey(i) !== action.key),
      };
    case "wishlist":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.id)
          ? state.wishlist.filter((id) => id !== action.id)
          : [...state.wishlist, action.id],
      };
    case "order":
      return state.cart.length
        ? { ...state, cart: [], orders: [action.order, ...state.orders] }
        : state;
    case "save-address":
      return {
        ...state,
        addresses: [
          ...state.addresses.filter((a) => a.id !== action.address.id),
          action.address,
        ],
      };
    case "delete-address":
      return {
        ...state,
        addresses: state.addresses.filter((a) => a.id !== action.id),
      };
    case "newsletter":
      return { ...state, newsletter: action.email };
  }
}
