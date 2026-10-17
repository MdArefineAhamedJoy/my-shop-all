import { BackgroundImage } from "@/components/ui/BackgroundImage";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CatalogState } from "@/components/commerce/CatalogState";
import { ProductList } from "@/components/commerce/ProductList";
import { Chip, EmptyState, IconButton, Input, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { categories, collectionBanners } from "@/data/storefront";
import { imageSource } from "@/data/images";
import { useCatalog } from "@/hooks/useCatalog";
import { filterProducts } from "@/utils/commerce";
import { FilterSheet } from "./components/FilterSheet";
import { useShopFilters } from "./hooks/useShopFilters";

export default function ShopScreen() {
  const state = useShopFilters();
  const { data = [], isPending, isError, refetch } = useCatalog();
  const { gender, tag, category } = state.filters;
  const products = filterProducts(data, state.filters);
  const image =
    gender === "men"
      ? collectionBanners.men
      : gender === "women"
        ? collectionBanners.women
        : collectionBanners.all;
  const header = (
    <>
      <BackgroundImage source={imageSource(image)} style={styles.banner}>
        <LinearGradient
          colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.7)"]}
          style={styles.bannerContent}
        >
          <Text style={styles.eyebrow}>THE MYSHOP EDIT · 2026</Text>
          <Text style={styles.title}>{state.title}</Text>
          <Text style={styles.bannerText}>
            Thoughtful essentials. Endless possibilities.
          </Text>
        </LinearGradient>
      </BackgroundImage>
      <View style={styles.controls}>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Input
              label="Find your next favorite"
              icon="search-outline"
              placeholder="Search pieces…"
              value={state.query}
              onChangeText={state.setQuery}
              autoFocus={state.focusSearch}
              autoCapitalize="none"
            />
          </View>
          <IconButton
            name="options-outline"
            label="Open filters and sort"
            selected={
              !!(
                state.extra.size ||
                state.extra.min ||
                state.extra.max ||
                state.extra.sort
              )
            }
            onPress={state.open}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {[
            ["Everyone", ""],
            ["Men", "men"],
            ["Women", "women"],
          ].map(([title, value]) => (
            <Chip
              key={title}
              title={title}
              selected={gender === value}
              onPress={() => router.setParams({ gender: value })}
            />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {categories.map((item) => (
            <Chip
              key={item.title}
              title={item.title}
              selected={category === item.value}
              onPress={() => router.setParams({ category: item.value })}
            />
          ))}
        </ScrollView>
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {products.length} pieces{tag ? ` · ${state.title}` : ""}
          </Text>
          <Chip title="Reset all" onPress={state.reset} />
        </View>
      </View>
    </>
  );
  return (
    <View style={styles.screen}>
      <ProductList
        products={isPending || isError ? [] : products}
        header={header}
        empty={
          isPending || isError ? (
            <CatalogState error={isError} onRetry={() => void refetch()} />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No pieces found"
              description="Try another search or reset your filters to see the full collection."
              action="Reset filters"
              onAction={state.reset}
            />
          )
        }
      />
      <FilterSheet state={state} />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.white },
  banner: {
    height: 190,
    backgroundColor: AppColors.text,
    margin: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerContent: { flex: 1, padding: 24, justifyContent: "flex-end" },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "500",
    color: "#FDBA74",
    marginBottom: 12,
  },
  title: { fontWeight: "700", fontSize: 29, letterSpacing: -1, color: "white" },
  bannerText: { fontSize: 11, color: "#E2E8F0", marginTop: 8 },
  controls: { paddingHorizontal: 20, paddingBottom: 18, paddingTop: 16 },
  searchRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  search: { flex: 1 },
  chips: { gap: 8, paddingBottom: 13 },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 2,
  },
  count: { fontSize: 11, color: AppColors.secondaryText, flex: 1 },
});
