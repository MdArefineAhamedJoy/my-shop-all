import { useFonts } from "expo-font";
import { fontAssets } from "@/constants/fontAssets";
import type { PropsWithChildren } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppErrorBoundary } from "@/components/layout/AppErrorBoundary";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { Notice } from "@/components/ui";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { useShop } from "@/hooks/useShop";
import { QueryProvider } from "./QueryProvider";
import { SessionProvider } from "./SessionProvider";
import { ShopProvider } from "./ShopProvider";

function Bootstrap({ children }: PropsWithChildren) {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const session = useSessionStatus();
  const shop = useShop();
  if (fontError) return <LoadingScreen failed />;
  if (!fontsLoaded || !session.ready) return <LoadingScreen />;
  return (
    <>
      {(session.error || shop.error) && (
        <Notice tone="error">{session.error || shop.error || ""}</Notice>
      )}
      {children}
    </>
  );
}
export function RootProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <QueryProvider>
          <SessionProvider>
            <ShopProvider>
              <Bootstrap>{children}</Bootstrap>
            </ShopProvider>
          </SessionProvider>
        </QueryProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
