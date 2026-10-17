import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { CatalogState } from "@/components/commerce/CatalogState";
import { Screen } from "@/components/layout/Screen";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Brand } from "@/components/layout/Brand";
import { Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { useCatalog } from "@/hooks/useCatalog";
import { HeroCarousel } from "./components/HeroCarousel";
import { Collections } from "./components/Collections";
import { Newsletter } from "./components/Newsletter";

const links = [
  { title: "Shop all", params: { gender: "", tag: "" } },
  { title: "Men", params: { gender: "men", tag: "" } },
  { title: "Women", params: { gender: "women", tag: "" } },
  { title: "New arrivals", params: { gender: "", tag: "new-arrival" } },
  { title: "Sale", params: { gender: "", tag: "sale" } },
];
const sections = [
  {
    title: "New Arrivals",
    subtitle: "The latest additions to your everyday.",
    tag: "new-arrival",
  },
  {
    title: "Trending Now",
    subtitle: "Good style is always in the details.",
    tag: "trending",
  },
  {
    title: "Best Sellers",
    subtitle: "Tried, loved and worn on repeat.",
    tag: "bestseller",
  },
];
export default function HomeScreen() {
  const { data = [], isPending, isError, refetch } = useCatalog();
  return (
    <Screen padded={false} safeBottom={false}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navigation}
      >
        {links.map((link) => (
          <Pressable
            key={link.title}
            accessibilityRole="link"
            accessibilityLabel={link.title}
            onPress={() =>
              router.push({
                pathname: "/shop",
                params: { ...link.params, category: "" },
              })
            }
            style={styles.navLink}
          >
            <Text
              style={[styles.navText, link.title === "Sale" && styles.sale]}
            >
              {link.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <HeroCarousel />
      <Collections />
      {isPending || isError ? (
        <CatalogState error={isError} onRetry={() => void refetch()} />
      ) : (
        sections.map((section) => (
          <View key={section.tag} style={styles.section}>
            <SectionHeading
              title={section.title}
              subtitle={section.subtitle}
              action="View all"
              onAction={() =>
                router.push({
                  pathname: "/shop",
                  params: { tag: section.tag, gender: "", category: "" },
                })
              }
            />
            <ProductGrid
              products={data
                .filter((product) => product.tags.includes(section.tag))
                .slice(0, 4)}
            />
          </View>
        ))
      )}
      <Newsletter />
      <View style={styles.footer}>
        <Brand small />
        <Text style={styles.footerText}>Style that feels like you.</Text>
        <Text style={styles.copyright}>© 2026 MYSHOP</Text>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  navigation: { paddingHorizontal: 20, gap: 26, paddingVertical: 9 },
  navLink: { minHeight: 44, justifyContent: "center" },
  navText: { fontSize: 12, fontWeight: "500" },
  sale: { color: AppColors.primaryDark },
  section: { paddingHorizontal: 20, paddingBottom: 26, paddingTop: 14 },
  footer: { alignItems: "center", gap: 10, paddingBottom: 28 },
  footerText: { color: AppColors.secondaryText, fontSize: 12 },
  copyright: { color: AppColors.secondaryText, fontSize: 10, marginTop: 8 },
});
