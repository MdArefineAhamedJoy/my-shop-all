import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { EmptyState, Icon, ProductImage, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { useShop } from "@/hooks/useShop";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { money } from "@/utils/commerce";

export default function OrdersScreen() {
  const { state } = useShop();
  const { user } = useSessionStatus();
  const orders = state.orders.filter(
    (order) => order.address.email.toLowerCase() === user?.email.toLowerCase()
  );
  return (
    <Screen>
      <View style={styles.container}>
        <SectionHeading
          title="Your recent favorites."
          subtitle="Preview orders saved on this device."
        />
        {orders.length ? (
          orders.map((order) => (
            <Pressable
              key={order.id}
              accessibilityRole="link"
              onPress={() =>
                router.push({
                  pathname: "/order/[id]",
                  params: { id: order.id },
                })
              }
              style={styles.card}
            >
              <View style={styles.top}>
                <Text style={styles.date}>
                  {new Date(order.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Preview</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.images}>
                  {order.items.slice(0, 3).map((item, index) => (
                    <ProductImage
                      key={index}
                      path={item.product.images[0]}
                      style={styles.image}
                    />
                  ))}
                </View>
                <Icon
                  name="chevron-forward"
                  color={AppColors.secondaryText}
                  size={18}
                />
              </View>
              <View style={styles.bottom}>
                <Text style={styles.count}>
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                  pieces
                </Text>
                <Text style={styles.total}>{money(order.total)}</Text>
              </View>
              <Text style={styles.id}>{order.id}</Text>
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon="cube-outline"
            title="Your story starts here."
            description="Orders placed in the checkout preview will appear here when the delivery email matches your profile."
            action="Find your first favorite"
            onAction={() => router.replace("/shop")}
          />
        )}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: {
    maxWidth: 700,
    width: "100%",
    alignSelf: "center",
    paddingTop: 12,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    marginBottom: 18,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  date: { fontSize: 12, fontWeight: "500" },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: AppColors.primaryLight,
  },
  badgeText: { fontSize: 10, color: AppColors.primaryDark },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  images: { flexDirection: "row", gap: 8 },
  image: { width: 64, height: 78, borderRadius: 8 },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    alignItems: "center",
  },
  count: { color: AppColors.secondaryText, fontSize: 12 },
  total: { fontSize: 17, fontWeight: "600" },
  id: { color: AppColors.secondaryText, fontSize: 9, marginTop: 12 },
});
