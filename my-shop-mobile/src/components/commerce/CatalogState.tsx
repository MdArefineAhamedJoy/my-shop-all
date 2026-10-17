import { ActivityIndicator, StyleSheet, View } from "react-native";
import { EmptyState } from "@/components/ui";
import { AppColors } from "@/constants";

export function CatalogState({
  error,
  onRetry,
}: {
  error?: boolean;
  onRetry: () => void;
}) {
  if (error)
    return (
      <EmptyState
        icon="refresh-outline"
        title="The collection is taking a moment."
        description="Please try loading the products again."
        action="Try again"
        onAction={onRetry}
      />
    );
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={AppColors.primary} />
    </View>
  );
}
const styles = StyleSheet.create({
  loading: { paddingVertical: 70, alignItems: "center" },
});
