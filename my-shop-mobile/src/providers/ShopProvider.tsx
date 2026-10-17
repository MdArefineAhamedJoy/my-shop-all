import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { STORAGE_KEYS } from "@/constants/storage";
import { storage } from "@/lib/storage";
import { ShopContext } from "@/store/ShopContext";
import { initialState, reducer } from "@/store/shopReducer";
import { isShopState } from "@/store/shopStorage";

export function ShopProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    storage
      .read(STORAGE_KEYS.shop, isShopState)
      .then((value) => {
        if (active && value) dispatch({ type: "hydrate", state: value });
      })
      .catch(() => {
        if (active)
          setError("Saved shopping data could not be restored on this device.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    writes.current = writes.current
      .then(() => storage.write(STORAGE_KEYS.shop, state))
      .catch(() =>
        setError(
          "Your latest changes could not be saved. Please check device storage."
        )
      );
  }, [ready, state]);
  return (
    <ShopContext.Provider value={{ state, dispatch, ready, error }}>
      {children}
    </ShopContext.Provider>
  );
}
