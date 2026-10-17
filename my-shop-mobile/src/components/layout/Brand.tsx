import { StyleSheet } from "react-native";
import { AppColors } from "@/constants";
import { Text } from "@/components/ui";
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Text style={[styles.brand, small && { fontSize: 23 }]}>
      MY
      <Text style={[styles.brand, styles.accent, small && { fontSize: 23 }]}>
        SHOP
      </Text>
    </Text>
  );
}
const styles = StyleSheet.create({
  brand: { fontWeight: "800", fontSize: 29, letterSpacing: -1.2 },
  accent: { color: AppColors.primary },
});
