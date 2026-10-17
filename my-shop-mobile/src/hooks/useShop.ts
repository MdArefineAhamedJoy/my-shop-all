import { useContext } from "react";
import { ShopContext } from "@/store/ShopContext";
import { totals } from "@/utils/commerce";

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("ShopProvider is missing.");
  return {
    ...context,
    count: context.state.cart.reduce((sum, item) => sum + item.quantity, 0),
    ...totals(context.state.cart),
  };
}
