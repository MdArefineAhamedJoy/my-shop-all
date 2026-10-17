import { Stack } from "expo-router";
import { AppHeader } from "@/components/layout/AppHeader";
export default function ShopStackLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => <AppHeader back title={options.title} />,
      }}
    >
      <Stack.Screen
        name="product/[slug]"
        options={{ title: "Product details" }}
      />
      <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
      <Stack.Screen name="order/[id]" options={{ title: "Order details" }} />
    </Stack>
  );
}
