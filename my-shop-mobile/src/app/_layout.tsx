import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { RootProviders } from "@/providers/RootProviders";
import { AppColors } from "@/constants";
export default function RootLayout() {
  return (
    <RootProviders>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AppColors.white },
        }}
      >
        <Stack.Screen name="(module)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(account)" />
      </Stack>
    </RootProviders>
  );
}
