import { Redirect, Stack, useGlobalSearchParams } from "expo-router";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { resolveAuthDestination } from "@/utils/navigation";
export default function AuthLayout() {
  const { isLoggedIn } = useSessionStatus();
  const { returnTo } = useGlobalSearchParams<{ returnTo?: string }>();
  const destination = resolveAuthDestination(returnTo);
  if (isLoggedIn) return <Redirect href={destination} />;
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  );
}
