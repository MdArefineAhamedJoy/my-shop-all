import { router } from "expo-router";
import { EmptyState } from "@/components/ui";
import { Screen } from "@/components/layout/Screen";
export default function NotFound() {
  return (
    <Screen>
      <EmptyState
        icon="compass-outline"
        title="A little off track."
        description="This page could not be found. Let's get you back to the collection."
        action="Back to the shop"
        onAction={() => router.replace("/")}
      />
    </Screen>
  );
}
