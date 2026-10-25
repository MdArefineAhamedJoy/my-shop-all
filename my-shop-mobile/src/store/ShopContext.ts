import { createContext } from "react";
import type { ShopState } from "@/types/shop";
import type { Action } from "./shopReducer";

export const ShopContext = createContext<{
  state: ShopState;
  dispatch: (action: Action) => Promise<boolean>;
  ready: boolean;
  error: string | null;
} | null>(null);
