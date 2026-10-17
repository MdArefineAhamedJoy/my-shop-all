import { createContext, type Dispatch } from "react";
import type { ShopState } from "@/types/shop";
import type { Action } from "./shopReducer";

export const ShopContext = createContext<{
  state: ShopState;
  dispatch: Dispatch<Action>;
  ready: boolean;
  error: string | null;
} | null>(null);
