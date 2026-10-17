import { BackgroundImage } from "@/components/ui/BackgroundImage";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Text } from "@/components/ui";
import { imageSource } from "@/data/images";
import { collections } from "@/data/storefront";
import { useResponsive } from "@/hooks/useResponsive";

export function Collections() {
  const { isWide } = useResponsive();
  return (
    <View style={styles.section}>
      <SectionHeading
        title="Shop by Collection"
        subtitle="An edit for every version of you."
      />
      <View style={styles.grid}>
        {collections.map((collection) => (
          <View
            key={collection.name}
            style={[styles.item, { width: isWide ? "25%" : "50%" }]}
          >
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Shop ${collection.name}`}
              onPress={() =>
                router.push({
                  pathname: "/shop",
                  params: { tag: collection.tag, gender: "", category: "" },
                })
              }
              style={styles.card}
            >
              <BackgroundImage
                source={imageSource(collection.image)}
                style={styles.image}
              >
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.78)"]}
                  style={styles.overlay}
                >
                  <Text style={styles.title}>{collection.name}</Text>
                  <Text style={styles.subtitle}>{collection.subtitle}</Text>
                  <Text style={styles.link}>Explore →</Text>
                </LinearGradient>
              </BackgroundImage>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { padding: 20, paddingTop: 34 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -7 },
  item: { paddingHorizontal: 7, marginBottom: 14 },
  card: { borderRadius: 14, overflow: "hidden", backgroundColor: "#374151" },
  image: { height: 245 },
  overlay: { flex: 1, padding: 16, justifyContent: "flex-end" },
  title: { color: "white", fontSize: 18, fontWeight: "600", lineHeight: 24 },
  subtitle: { color: "#E2E8F0", fontSize: 10, lineHeight: 16, marginTop: 6 },
  link: { color: "white", fontSize: 11, fontWeight: "600", marginTop: 16 },
});
