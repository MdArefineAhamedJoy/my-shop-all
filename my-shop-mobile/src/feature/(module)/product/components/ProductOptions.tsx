import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomSheet, Chip, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import type { Product } from "@/types/product";
import type { useProductDetails } from "../hooks/useProductDetails";

export function ProductOptions({
  product,
  selection,
}: {
  product: Product;
  selection: ReturnType<typeof useProductDetails>;
}) {
  const [guide, setGuide] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Color{" "}
        <Text style={styles.value}>/ {selection.color || "Standard"}</Text>
      </Text>
      <View style={styles.options}>
        {product.colors?.map((color) => (
          <Chip
            key={color}
            title={color}
            selected={color === selection.color}
            onPress={() => selection.setColor(color)}
          />
        ))}
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>
          Size{" "}
          <Text style={styles.value}>
            / {selection.size || "Select a size"}
          </Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.guide}
          onPress={() => setGuide(true)}
        >
          <Text style={styles.guideText}>Size guide</Text>
        </Pressable>
      </View>
      <View style={styles.options}>
        {product.sizes.map((size) => (
          <Chip
            key={size}
            title={size}
            selected={size === selection.size}
            onPress={() => selection.setSize(size)}
          />
        ))}
      </View>
      <BottomSheet
        title="Size guide"
        visible={guide}
        onClose={() => setGuide(false)}
      >
        <Text style={styles.guideCopy}>
          Available sizes: {product.sizes.join(", ")}
          {"\n\n"}Numbered sizes refer to waist measurements in inches. Compare
          your preferred fit with a garment you already own. Exact garment
          measurements will appear here when the product catalog includes them.
        </Text>
      </BottomSheet>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 12, marginTop: 24 },
  label: { fontSize: 13, fontWeight: "600" },
  value: { fontSize: 12, color: AppColors.secondaryText },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  guide: { minHeight: 44, justifyContent: "center" },
  guideText: {
    fontSize: 11,
    color: AppColors.secondaryText,
    textDecorationLine: "underline",
  },
  guideCopy: {
    color: AppColors.secondaryText,
    lineHeight: 24,
    paddingBottom: 20,
  },
});
