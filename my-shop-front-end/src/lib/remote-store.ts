import { create } from "zustand";
import { toast } from "sonner";
import { CartItem } from "@/types/cart.type";
import { Product } from "@/types/product.type";
import { WishlistItem } from "@/types/wishlist.type";
import { api, ApiError, ApiProduct, ApiVariant } from "./api";
import { productFromApi } from "./products";
interface ShopUser {
  id: string;
  name: string;
  email: string;
  version: number;
}
interface StoreState {
  user: ShopUser | null;
  cart: CartItem[];
  wishlist: WishlistItem[];
  refresh: () => Promise<void>;
  addToCart: (
    product: Product,
    size: string,
    color?: string,
    quantity?: number,
  ) => Promise<boolean>;
  removeFromCart: (id: string, size: string, color?: string) => Promise<void>;
  updateCartQuantity: (
    id: string,
    size: string,
    quantity: number,
    color?: string,
  ) => Promise<void>;
  clearCart: () => void;
  addToWishlist: (p: Product) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  isMiniCartOpen: boolean;
  setMiniCartOpen: (v: boolean) => void;
  isWishlistOpen: boolean;
  setWishlistOpen: (v: boolean) => void;
}
function showError(error: unknown) {
  toast.error(error instanceof Error ? error.message : "Request failed");
  if (error instanceof ApiError && error.status === 401)
    window.location.assign(
      `/login?next=${encodeURIComponent(location.pathname)}`,
    );
}
let refreshSequence = 0;
let queue: Promise<unknown> = Promise.resolve();
function queued<T>(action: () => Promise<T>): Promise<T> {
  const next = queue.then(action, action);
  queue = next.catch(() => {});
  return next;
}
export const useStore = create<StoreState>((set, get) => ({
  user: null,
  cart: [],
  wishlist: [],
  refresh: async () => {
    const sequence = ++refreshSequence;
    try {
      const user = await api<ShopUser>("me");
      const [cart, wishlist] = await Promise.all([
        api<{
          items: {
            quantity: number;
            variantId: string;
            variant: ApiVariant & { product: ApiProduct };
          }[];
        }>("cart"),
        api<{ product: ApiProduct }[]>("me/wishlist?limit=100"),
      ]);
      if (sequence === refreshSequence)
        set({
          user,
          cart: cart.items.map((i) => ({
            variantId: i.variantId,
            product: productFromApi({
              ...i.variant.product,
              variants: [{ ...i.variant, maxOrderQuantity: 99 }],
            }),
            selectedSize: i.variant.size,
            selectedColor: i.variant.color,
            quantity: i.quantity,
          })),
          wishlist: wishlist.map((w) => ({
            product: productFromApi({
              ...w.product,
              variants: w.product.variants || [],
            }),
            addedAt: new Date(),
          })),
        });
    } catch (error) {
      if (sequence !== refreshSequence) return;
      if (error instanceof ApiError && error.status === 401)
        set({ user: null, cart: [], wishlist: [] });
      else showError(error);
    }
  },
  addToCart: (product, size, color, quantity = 1) =>
    queued(async () => {
      try {
        const v = product.variants?.find(
          (v) => v.size === size && (!color || v.color === color),
        );
        if (!v) throw new Error("Choose an available size and color");
        const current = get().cart.find((i) => i.variantId === v.id);
        await api(`cart/items/${v.id}`, {
          method: "PUT",
          body: JSON.stringify({
            quantity: (current?.quantity || 0) + quantity,
          }),
        });
        await get().refresh();
        set({ isMiniCartOpen: true });
        return true;
      } catch (e) {
        showError(e);
        return false;
      }
    }),
  removeFromCart: async (id, size, color) => {
    try {
      const item = get().cart.find(
        (i) =>
          i.product.id === id &&
          i.selectedSize === size &&
          (!color || i.selectedColor === color),
      );
      if (item) {
        await api(`cart/items/${item.variantId}`, { method: "DELETE" });
        await get().refresh();
      }
    } catch (e) {
      showError(e);
    }
  },
  updateCartQuantity: async (id, size, quantity, color) => {
    try {
      const item = get().cart.find(
        (i) =>
          i.product.id === id &&
          i.selectedSize === size &&
          (!color || i.selectedColor === color),
      );
      if (item) {
        await api(`cart/items/${item.variantId}`, {
          method: "PUT",
          body: JSON.stringify({ quantity }),
        });
        await get().refresh();
      }
    } catch (e) {
      showError(e);
    }
  },
  clearCart: () => set({ cart: [] }),
  addToWishlist: async (product) => {
    try {
      await api(`me/wishlist/${product.id}`, { method: "PUT" });
      await get().refresh();
    } catch (e) {
      showError(e);
    }
  },
  removeFromWishlist: async (id) => {
    try {
      await api(`me/wishlist/${id}`, { method: "DELETE" });
      await get().refresh();
    } catch (e) {
      showError(e);
    }
  },
  clearWishlist: () => set({ wishlist: [] }),
  isInWishlist: (id) => get().wishlist.some((i) => i.product.id === id),
  isMobileMenuOpen: false,
  setMobileMenuOpen: (v) => set({ isMobileMenuOpen: v }),
  isMiniCartOpen: false,
  setMiniCartOpen: (v) => set({ isMiniCartOpen: v }),
  isWishlistOpen: false,
  setWishlistOpen: (v) => set({ isWishlistOpen: v }),
}));
