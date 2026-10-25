import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { ShopContext } from "@/store/ShopContext";
import { initialState, type Action } from "@/store/shopReducer";
import { useSessionContext } from "./SessionProvider";
import { api } from "@/services/api";
import { addressToApi, loadShop } from "@/services/liveShopService";
import { cartKey } from "@/utils/commerce";
import type { ShopState } from "@/types/shop";
import type { UserProfile } from "@/types/auth";

export function ShopProvider({ children }: PropsWithChildren) {
  const { session, ready } = useSessionContext();
  return (
    <OwnedShopProvider user={session?.user} sessionReady={ready}>
      {children}
    </OwnedShopProvider>
  );
}
function OwnedShopProvider({
  children,
  user,
  sessionReady,
}: PropsWithChildren<{ user?: UserProfile; sessionReady: boolean }>) {
  const [owned, setOwned] = useState<{
    owner: string;
    data: ShopState;
    error: string | null;
    loaded: boolean;
  } | null>(null);
  const state =
    owned?.owner === user?.id ? owned?.data || initialState : initialState;
  const error =
    owned?.owner === (user?.id || "anonymous") ? owned?.error || null : null;
  const identity = useRef(user?.id);
  const current = useRef<{ owner: string; data: ShopState } | null>(null),
    alive = useRef(true),
    queue = useRef(Promise.resolve());
  const refresh = useCallback(async () => {
    if (!user) return;
    const next = await loadShop(user);
    if (alive.current && identity.current === user.id) {
      current.current = { owner: user.id, data: next };
      setOwned({ owner: user.id, data: next, error: null, loaded: true });
    }
  }, [user]);
  useEffect(() => {
    alive.current = true;
    identity.current = user?.id;
    current.current = null;
    if (sessionReady && user)
      void refresh().catch((e) => {
        if (alive.current && identity.current === user.id)
          setOwned({
            owner: user.id,
            data: initialState,
            error: e.message,
            loaded: true,
          });
      });
    return () => {
      alive.current = false;
    };
  }, [sessionReady, user, refresh]);
  const dispatch = useCallback(
    (action: Action): Promise<boolean> => {
      const result = queue.current
        .then(async () => {
          if (!alive.current) return false;
          if (action.type === "newsletter") {
            await api("newsletter/subscriptions", {
              method: "POST",
              body: JSON.stringify({
                email: action.email,
                consentRevision: "2026-10",
              }),
            });
            return true;
          }
          if (!user) throw new Error("Please sign in to continue");
          if (current.current?.owner !== user.id) await refresh();
          if (!alive.current) return false;
          const snapshot =
            current.current?.owner === user.id
              ? current.current.data
              : initialState;
          switch (action.type) {
            case "add": {
              const v = action.product.variants?.find(
                (v) => v.size === action.size && v.color === action.color
              );
              if (!v) throw new Error("Select an available size and color");
              const existing = snapshot.cart.find((i) => i.variantId === v.id);
              await api(`cart/items/${v.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  quantity: (existing?.quantity || 0) + action.quantity,
                }),
              });
              break;
            }
            case "quantity":
            case "remove": {
              const item = snapshot.cart.find((i) => cartKey(i) === action.key);
              if (item)
                await api(`cart/items/${item.variantId}`, {
                  method: action.type === "remove" ? "DELETE" : "PUT",
                  ...(action.type === "quantity"
                    ? { body: JSON.stringify({ quantity: action.quantity }) }
                    : {}),
                });
              break;
            }
            case "wishlist":
              await api(`me/wishlist/${action.id}`, {
                method: snapshot.wishlist.includes(action.id)
                  ? "DELETE"
                  : "PUT",
              });
              break;
            case "save-address": {
              const previous = snapshot.addresses.find(
                (a) => a.id === action.address.id
              );
              await api(
                previous ? `me/addresses/${previous.id}` : "me/addresses",
                {
                  method: previous ? "PUT" : "POST",
                  body: JSON.stringify({
                    label: action.address.label,
                    details: addressToApi(action.address),
                    ...(previous ? { expectedVersion: previous.version } : {}),
                  }),
                }
              );
              break;
            }
            case "delete-address":
              await api(`me/addresses/${action.id}`, { method: "DELETE" });
              break;
            case "order":
              break;
            case "hydrate":
              return false;
          }
          await refresh();
          return true;
        })
        .catch((e) => {
          if (alive.current && identity.current === user?.id)
            setOwned((s) => ({
              owner: user?.id || "anonymous",
              data:
                s?.owner === user?.id ? s?.data || initialState : initialState,
              error: e instanceof Error ? e.message : "Request failed",
              loaded: true,
            }));
          return false;
        });
      queue.current = result.then(() => {});
      return result;
    },
    [refresh, user]
  );
  return (
    <ShopContext.Provider
      value={{
        state,
        dispatch,
        ready:
          sessionReady && (!user || (owned?.owner === user.id && owned.loaded)),
        error,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}
