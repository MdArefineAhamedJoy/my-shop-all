import { CartItem } from "@/types/cart.type";
import { Product } from "@/types/product.type";
import { WishlistItem } from "@/types/wishlist.type";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreState {
  // Cart State
  cart: CartItem[];
  addToCart: (
    product: Product,
    selectedSize: string,
    selectedColor?: string,
    quantity?: number,
  ) => void;
  removeFromCart: (productId: string, selectedSize: string) => void;
  updateCartQuantity: (
    productId: string,
    selectedSize: string,
    quantity: number,
  ) => void;
  clearCart: () => void;

  // Wishlist State
  wishlist: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;

  // UI State
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  isMiniCartOpen: boolean;
  setMiniCartOpen: (isOpen: boolean) => void;
  isWishlistOpen: boolean;
  setWishlistOpen: (isOpen: boolean) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Cart State
      cart: [],

      addToCart: (product, selectedSize, selectedColor, quantity = 1) => {
        const cart = get().cart;
        const existingItemIndex = cart.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize === selectedSize,
        );

        if (existingItemIndex > -1) {
          const newCart = [...cart];
          newCart[existingItemIndex].quantity += quantity;
          set({ cart: newCart });
        } else {
          set({
            cart: [...cart, { product, quantity, selectedSize, selectedColor }],
          });
        }

        // Auto-open mini cart
        set({ isMiniCartOpen: true });
      },

      removeFromCart: (productId, selectedSize) => {
        set({
          cart: get().cart.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedSize === selectedSize
              ),
          ),
        });
      },

      updateCartQuantity: (productId, selectedSize, quantity) => {
        const cart = get().cart;
        const itemIndex = cart.findIndex(
          (item) =>
            item.product.id === productId && item.selectedSize === selectedSize,
        );

        if (itemIndex > -1) {
          const newCart = [...cart];
          newCart[itemIndex].quantity = quantity;
          set({ cart: newCart });
        }
      },

      clearCart: () => set({ cart: [] }),

      // Wishlist State
      wishlist: [],

      addToWishlist: (product) => {
        if (!get().isInWishlist(product.id)) {
          set({
            wishlist: [...get().wishlist, { product, addedAt: new Date() }],
          });
        }
      },

      removeFromWishlist: (productId) => {
        set({
          wishlist: get().wishlist.filter(
            (item) => item.product.id !== productId,
          ),
        });
      },

      clearWishlist: () => set({ wishlist: [] }),

      isInWishlist: (productId) => {
        return get().wishlist.some((item) => item.product.id === productId);
      },

      // UI State
      isMobileMenuOpen: false,
      setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),

      isMiniCartOpen: false,
      setMiniCartOpen: (isOpen) => set({ isMiniCartOpen: isOpen }),
      isWishlistOpen: false,
      setWishlistOpen: (isOpen) => set({ isWishlistOpen: isOpen }),
    }),
    {
      name: "my-shop-storage",
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
      }),
    },
  ),
);
