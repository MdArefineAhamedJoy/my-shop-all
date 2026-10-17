import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton, Text } from "@/components/ui";
import { AppColors, layout } from "@/constants";
import { useShop } from "@/hooks/useShop";
import { Brand } from "./Brand";

export function AppHeader({
  title,
  back = false,
}: {
  title?: string;
  back?: boolean;
}) {
  const { count } = useShop();
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.inner}>
        {back ? (
          <View style={styles.row}>
            <IconButton
              name="arrow-back"
              label="Go back"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
            />
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="MYSHOP home"
            onPress={() => router.navigate("/")}
          >
            <Brand small />
          </Pressable>
        )}
        {!back && (
          <View style={styles.actions}>
            <IconButton
              name="search-outline"
              label="Search products"
              onPress={() =>
                router.navigate({ pathname: "/shop", params: { search: "1" } })
              }
            />
            <IconButton
              name="bag-handle-outline"
              label="Open shopping bag"
              badge={count}
              onPress={() => router.navigate("/cart")}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  inner: {
    height: 64,
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: { flexDirection: "row", gap: 8, alignItems: "center", flex: 1 },
  title: { fontSize: 16, fontWeight: "600", flex: 1 },
  actions: { flexDirection: "row", gap: 4 },
});
