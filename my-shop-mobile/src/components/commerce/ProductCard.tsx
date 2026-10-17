import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, ProductImage, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { useShop } from "@/hooks/useShop";
import type { Product } from "@/types/product";
import { money } from "@/utils/commerce";

export function ProductCard({ product }: { product: Product }) {
  const { state, dispatch } = useShop();
  const saved = state.wishlist.includes(product.id);
  const open = () =>
    router.push({
      pathname: "/product/[slug]",
      params: { slug: product.slug },
    });
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View ${product.name}`}
          onPress={open}
        >
          <ProductImage
            path={product.images[0]}
            resizeMode="cover"
            style={styles.image}
          />
        </Pressable>
        {!!discount && (
          <View style={styles.sale}>
            <Text style={styles.saleText}>−{discount}%</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${saved ? "Remove from" : "Add to"} wishlist: ${product.name}`}
          accessibilityState={{ selected: saved }}
          onPress={() => dispatch({ type: "wishlist", id: product.id })}
          style={styles.favorite}
        >
          <Icon
            name={saved ? "heart" : "heart-outline"}
            size={19}
            color={saved ? AppColors.primaryDark : AppColors.text}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Choose size for ${product.name}`}
          onPress={open}
          style={styles.add}
        >
          <Icon name="add" size={19} color="white" />
        </Pressable>
      </View>
      <Pressable accessibilityRole="link" onPress={open} style={styles.details}>
        <Text style={styles.category}>
          {product.category.replace("-", " ").toUpperCase()}
        </Text>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{money(product.price)}</Text>
          {product.originalPrice && (
            <Text style={styles.original}>{money(product.originalPrice)}</Text>
          )}
        </View>
        <View style={styles.rating}>
          <Icon name="star" color="#D97706" size={11} />
          <Text style={styles.ratingText}>
            {product.rating}{" "}
            <Text style={styles.ratingText}>({product.reviewCount})</Text>
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, marginBottom: 18 },
  imageWrap: { position: "relative" },
  image: {
    width: "100%",
    aspectRatio: 0.8,
    height: undefined,
    borderRadius: 14,
    backgroundColor: AppColors.background,
  },
  favorite: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },
  sale: {
    position: "absolute",
    top: 13,
    left: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: AppColors.white,
    borderRadius: 5,
  },
  saleText: { color: AppColors.primaryDark, fontSize: 10, fontWeight: "700" },
  add: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  details: { paddingTop: 12, gap: 6 },
  category: { fontSize: 9, letterSpacing: 1.2, color: AppColors.secondaryText },
  name: { fontSize: 13, lineHeight: 19, fontWeight: "500", minHeight: 38 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  price: { fontWeight: "700", fontSize: 15 },
  original: {
    color: AppColors.secondaryText,
    textDecorationLine: "line-through",
    fontSize: 11,
  },
  rating: { flexDirection: "row", gap: 4, alignItems: "center" },
  ratingText: { color: AppColors.secondaryText, fontSize: 10 },
});
