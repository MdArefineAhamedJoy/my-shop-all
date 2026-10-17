import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppColors } from "@/constants";

export function LoadingScreen({ failed = false }: { failed?: boolean }) {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>
        MY<Text style={styles.accent}>SHOP</Text>
      </Text>
      <Text style={styles.tagline}>
        {failed
          ? "Fonts could not load. Reload the app to try again."
          : "Style that feels like you."}
      </Text>
      {!failed && (
        <ActivityIndicator style={styles.loader} color={AppColors.primary} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  brand: { fontSize: 29, fontWeight: "800", color: AppColors.text },
  accent: { color: AppColors.primary },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.white,
  },
  tagline: { color: AppColors.secondaryText, fontSize: 12, marginTop: 12 },
  loader: { marginTop: 28 },
});
