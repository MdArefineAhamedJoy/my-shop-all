import { Redirect } from "expo-router";
import type { PropsWithChildren } from "react";
import { useSessionStatus } from "@/hooks/useSessionStatus";

interface RequireSessionProps extends PropsWithChildren {
  destination: "/profile" | "/orders" | "/addresses";
}
export function RequireSession({ destination, children }: RequireSessionProps) {
  const { isLoggedIn } = useSessionStatus();
  if (!isLoggedIn)
    return (
      <Redirect
        href={{ pathname: "/login", params: { returnTo: destination } }}
      />
    );
  return children;
}
