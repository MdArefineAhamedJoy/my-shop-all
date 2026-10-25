import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ProductList } from "@/components/commerce/ProductList";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { EmptyState } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { productFromApi, RemoteProduct } from "@/services/liveCatalogService";
import { useShop } from "@/hooks/useShop";

export default function WishlistScreen() {
  const { state } = useShop();
  const { data: products = [] } = useQuery({
    queryKey: ["wishlist", ...state.wishlist],
    queryFn: async () =>
      (await api<{ product: RemoteProduct }[]>("me/wishlist?limit=100")).map(
        (row) => productFromApi(row.product)
      ),
    enabled: state.wishlist.length > 0,
  });
  return (
    <ProductList
      products={products}
      header={
        <View style={styles.header}>
          <SectionHeading
            title="Your Wishlist"
            subtitle={`${products.length} favorites, ready when you are.`}
          />
        </View>
      }
      empty={
        <EmptyState
          icon="heart-outline"
          title="Keep the ones you love."
          description="Tap the heart on any piece to save it here. A little inspiration for later."
          action="Explore the collection"
          onAction={() => router.navigate("/shop")}
        />
      }
    />
  );
}
const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 6, paddingTop: 30 },
});
