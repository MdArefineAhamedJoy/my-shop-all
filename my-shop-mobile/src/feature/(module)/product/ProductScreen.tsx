import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { QuantitySelector } from "@/components/commerce/QuantitySelector";
import { Screen } from "@/components/layout/Screen";
import { SectionHeading } from "@/components/layout/SectionHeading";
import {
  Button,
  EmptyState,
  Icon,
  IconButton,
  Notice,
  Text,
} from "@/components/ui";
import { AppColors } from "@/constants";
import { getProductBySlug, MOCK_PRODUCTS } from "@/data/products";
import { useResponsive } from "@/hooks/useResponsive";
import type { Product } from "@/types/product";
import { money } from "@/utils/commerce";
import { ProductGallery } from "./components/ProductGallery";
import { ProductOptions } from "./components/ProductOptions";
import { ProductVideo } from "./components/ProductVideo";
import { useProductDetails } from "./hooks/useProductDetails";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const product = getProductBySlug(Array.isArray(slug) ? slug[0] : slug);
  return product ? (
    <ProductDetails key={product.id} product={product} />
  ) : (
    <Screen>
      <EmptyState
        title="This piece isn't here."
        description="It may no longer be available in the collection."
        action="Browse the collection"
        onAction={() => router.replace("/shop")}
      />
    </Screen>
  );
}
function ProductDetails({ product }: { product: Product }) {
  const selection = useProductDetails(product);
  const { isWide } = useResponsive();
  const related = MOCK_PRODUCTS.filter(
    (item) => item.category === product.category && item.id !== product.id
  ).slice(0, 4);
  const footer = (
    <View style={styles.footerWrap}>
      {!!selection.message && (
        <Notice tone={selection.added ? "success" : "error"}>
          {selection.message}
        </Notice>
      )}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Your selection</Text>
          <Text style={styles.totalPrice}>
            {money(product.price * selection.quantity)}
          </Text>
        </View>
        <View style={styles.footerButton}>
          <Button
            title="Add to bag"
            icon="bag-handle-outline"
            disabled={!selection.available}
            onPress={() => selection.addToBag()}
          />
        </View>
      </View>
    </View>
  );
  return (
    <Screen footer={footer}>
      <View style={[styles.layout, isWide && styles.wide]}>
        <View style={[styles.gallery, isWide && styles.half]}>
          <ProductGallery images={product.images} />
        </View>
        <View style={[styles.info, isWide && styles.half]}>
          <View style={styles.headingRow}>
            <Text style={styles.eyebrow}>
              {product.tags.includes("new-arrival")
                ? "JUST ARRIVED"
                : "THE MYSHOP EDIT"}
            </Text>
            <IconButton
              name={selection.saved ? "heart" : "heart-outline"}
              label={
                selection.saved ? "Remove from wishlist" : "Add to wishlist"
              }
              selected={selection.saved}
              onPress={selection.toggleWishlist}
            />
          </View>
          <Text style={styles.title}>{product.name}</Text>
          <View style={styles.rating}>
            <Icon name="star" size={14} color="#D97706" />
            <Text style={styles.ratingCopy}>
              {product.rating} · {product.reviewCount} reviews
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{money(product.price)}</Text>
            {product.originalPrice && (
              <Text style={styles.original}>
                {money(product.originalPrice)}
              </Text>
            )}
          </View>
          <Text style={styles.description}>{product.description}</Text>
          <ProductOptions product={product} selection={selection} />
          <View style={styles.quantityRow}>
            <QuantitySelector
              value={selection.quantity}
              onChange={selection.setQuantity}
              max={Math.max(1, selection.available)}
            />
            <Text
              style={[styles.stock, !selection.available && styles.unavailable]}
            >
              {selection.available
                ? `${selection.available} available`
                : "Stock limit reached"}
            </Text>
          </View>
          {selection.added && (
            <Button
              title="View your bag"
              variant="ghost"
              onPress={() => router.push("/cart")}
            />
          )}
          <Button
            title="Buy now"
            variant="secondary"
            disabled={!selection.available}
            onPress={() => selection.addToBag(true)}
          />
          <View style={styles.assurance}>
            <Icon
              name="shield-checkmark-outline"
              size={19}
              color={AppColors.secondaryText}
            />
            <Text style={styles.assuranceText}>
              Quality essentials, thoughtfully selected.
            </Text>
          </View>
          <Text style={styles.sku}>SKU: {product.sku}</Text>
          {product.video && <ProductVideo uri={product.video} />}
        </View>
      </View>
      {!!related.length && (
        <View style={styles.related}>
          <SectionHeading
            title="You may also like"
            subtitle="A few pieces to complete the picture."
          />
          <ProductGrid products={related} />
        </View>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  footerWrap: { gap: 12 },
  layout: { gap: 24 },
  wide: { flexDirection: "row", gap: 36 },
  half: { flex: 1 },
  gallery: { minWidth: 0 },
  info: { gap: 12 },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: AppColors.primaryDark,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  rating: { flexDirection: "row", gap: 6, alignItems: "center" },
  ratingCopy: { fontSize: 12, color: AppColors.secondaryText },
  priceRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginTop: 4,
  },
  price: { fontSize: 28, fontWeight: "700" },
  original: {
    fontSize: 17,
    color: AppColors.secondaryText,
    textDecorationLine: "line-through",
  },
  description: {
    color: AppColors.secondaryText,
    lineHeight: 24,
    fontSize: 13,
    marginTop: 8,
  },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  stock: { fontSize: 11, color: AppColors.success },
  unavailable: { color: AppColors.error },
  assurance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderColor: AppColors.border,
    paddingTop: 22,
    marginTop: 10,
  },
  assuranceText: { color: AppColors.secondaryText, fontSize: 12, flex: 1 },
  sku: { color: AppColors.secondaryText, fontSize: 10 },
  related: { marginTop: 44 },
  footer: { flexDirection: "row", alignItems: "center", gap: 20 },
  totalLabel: { fontSize: 10, color: AppColors.secondaryText, marginBottom: 5 },
  totalPrice: { fontSize: 21, fontWeight: "700" },
  footerButton: { flex: 1 },
});
