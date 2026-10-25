import type { ReactElement } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { AppColors, layout } from "@/constants";
import { useResponsive } from "@/hooks/useResponsive";
import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

export function ProductList({
  products,
  header,
  empty,
  footer,
}: {
  products: Product[];
  header: ReactElement;
  empty: ReactElement;
  footer?: ReactElement;
}) {
  const { contentWidth, columns } = useResponsive();
  const cardWidth = (contentWidth - 40 - (columns - 1) * 14) / columns;
  return (
    <FlatList
      key={columns}
      data={products}
      numColumns={columns}
      keyExtractor={(product) => product.id}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={footer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.list}
      contentContainerStyle={styles.content}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <View style={{ width: cardWidth }}>
          <ProductCard product={item} />
        </View>
      )}
    />
  );
}
const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: AppColors.white },
  content: {
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
    paddingBottom: 20,
  },
  row: { paddingHorizontal: 20, gap: 14 },
});
