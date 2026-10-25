import { router } from "expo-router";
import { useState } from "react";
import { useShop } from "@/hooks/useShop";
import type { Product } from "@/types/product";

export function useProductDetails(product: Product) {
  const { state, dispatch } = useShop();
  const [size, setSize] = useState("");
  const [color, setColor] = useState(product.colors?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const reserved = state.cart
    .filter(
      (item) =>
        item.product.id === product.id &&
        item.size === size &&
        item.color === color
    )
    .reduce((sum, item) => sum + item.quantity, 0);
  const selectedVariant = product.variants?.find(
    (v) => v.size === size && v.color === color
  );
  const available = Math.max(
    0,
    (selectedVariant?.maxOrderQuantity ?? product.stock) - reserved
  );
  const clearNotice = () => {
    setMessage("");
    setAdded(false);
  };
  const addToBag = async (buyNow = false) => {
    setAdded(false);
    if (!size) {
      setMessage("Please select your size first.");
      return;
    }
    if (quantity > available) {
      setMessage(`Only ${available} more pieces are available.`);
      return;
    }
    if (!(await dispatch({ type: "add", product, size, color, quantity }))) {
      setMessage("Could not update your bag. Please sign in and try again.");
      return;
    }
    setAdded(true);
    setMessage("Added to your bag.");
    if (buyNow) router.push("/checkout");
  };
  return {
    size,
    setSize: (value: string) => {
      setSize(value);
      clearNotice();
    },
    color,
    setColor: (value: string) => {
      setColor(value);
      clearNotice();
    },
    quantity,
    setQuantity: (value: number) => {
      setQuantity(value);
      clearNotice();
    },
    message,
    added,
    available,
    addToBag,
    saved: state.wishlist.includes(product.id),
    toggleWishlist: () => dispatch({ type: "wishlist", id: product.id }),
  };
}
