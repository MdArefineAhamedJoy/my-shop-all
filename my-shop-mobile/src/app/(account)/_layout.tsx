import { Stack } from "expo-router";
import { AppHeader } from "@/components/layout/AppHeader";
export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => <AppHeader back title={options.title} />,
      }}
    >
      <Stack.Screen
        name="profile/index"
        options={{ title: "Personal information" }}
      />
      <Stack.Screen name="orders/index" options={{ title: "My orders" }} />
      <Stack.Screen
        name="addresses/index"
        options={{ title: "Address book" }}
      />
    </Stack>
  );
}
