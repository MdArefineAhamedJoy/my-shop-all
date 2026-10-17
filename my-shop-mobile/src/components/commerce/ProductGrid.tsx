import { StyleSheet, View } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  const { columns } = useResponsive();
  return (
    <View style={styles.grid}>
      {products.map((product) => (
        <View
          key={product.id}
          style={[styles.item, { width: `${100 / columns}%` }]}
        >
          <ProductCard product={product} />
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -7 },
  item: { paddingHorizontal: 7 },
});
