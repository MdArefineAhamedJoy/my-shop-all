import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { OrderSummary, SummaryRow } from "@/components/commerce/OrderSummary";
import { Screen } from "@/components/layout/Screen";
import {
  Button,
  EmptyState,
  Icon,
  Notice,
  ProductImage,
  Text,
} from "@/components/ui";
import { AppColors } from "@/constants";
import { useShop } from "@/hooks/useShop";
import { cartKey, money } from "@/utils/commerce";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { orderFromApi, RemoteOrder } from "@/services/liveShopService";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { OnlinePayment } from "@/components/commerce/OnlinePayment";

export default function OrderDetailsScreen() {
  const { id, placed } = useLocalSearchParams<{
    id: string;
    placed?: string;
  }>();
  const { state } = useShop();
  const { user } = useSessionStatus();
  const query = useQuery({
    queryKey: ["order", user?.id, id],
    queryFn: async () =>
      orderFromApi(await api<RemoteOrder>(`orders/${id}`), user?.email || ""),
    enabled: !!user && !!id,
  });
  const order = query.data || state.orders.find((item) => item.id === id);
  if (!order)
    return (
      <Screen>
        <EmptyState
          icon="receipt-outline"
          title="Order not found."
          description="This order is unavailable for your account."
          action="Back to the collection"
          onAction={() => router.replace("/shop")}
        />
      </Screen>
    );
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.heading}>
          <View style={styles.check}>
            <Icon name="checkmark" size={36} color={AppColors.success} />
          </View>
          <Text style={styles.title}>
            {placed ? "A great choice." : "Your order details."}
          </Text>
          <Text style={styles.subtitle}>
            {placed
              ? "Your order has been placed."
              : "A little reminder of your recent favorites."}
          </Text>
          <Text selectable style={styles.id}>
            {order.id}
          </Text>
        </View>
        <Notice>
          {`Order status: ${order.status || "pending"}. Payment: ${order.paymentStatus || "unpaid"}.`}
        </Notice>
        <View style={styles.items}>
          {order.items.map((item) => (
            <View key={cartKey(item)} style={styles.item}>
              <ProductImage
                path={item.product.images[0]}
                style={styles.image}
              />
              <View style={styles.itemCopy}>
                <Text style={styles.name}>{item.product.name}</Text>
                <Text style={styles.variant}>
                  Size {item.size} · {item.color} · Qty {item.quantity}
                </Text>
                <Text style={styles.price}>
                  {money(item.product.price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <OrderSummary items={order.items} serverTotals={order.totals}>
          <SummaryRow
            label="Payment selection"
            value={
              order.payment === "cod"
                ? "Cash on delivery"
                : "Secure online payment"
            }
          />
        </OrderSummary>
        {order.payment === "sslcommerz" &&
          order.paymentStatus === "unpaid" &&
          order.status !== "cancelled" && (
            <OnlinePayment id={order.id} onRefresh={() => query.refetch()} />
          )}
        <View style={styles.shipping}>
          <Text style={styles.shippingTitle}>Delivery details</Text>
          <Text style={styles.address}>
            {order.address.firstName} {order.address.lastName}
            {"\n"}
            {order.address.address}
            {"\n"}
            {order.address.city} {order.address.postalCode}, Bangladesh{"\n"}
            {order.address.phone}
          </Text>
        </View>
        <Button
          title="Continue shopping"
          icon="arrow-forward"
          onPress={() => router.replace("/shop")}
        />
        <Button
          title="View all orders"
          variant="ghost"
          onPress={() => router.replace("/orders")}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: { maxWidth: 700, width: "100%", alignSelf: "center", gap: 18 },
  heading: { alignItems: "center", paddingVertical: 24 },
  check: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.successLight,
    marginBottom: 24,
  },
  title: {
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -1,
    textAlign: "center",
  },
  subtitle: {
    color: AppColors.secondaryText,
    fontSize: 13,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  id: { color: AppColors.secondaryText, fontSize: 10, marginTop: 14 },
  items: { marginTop: 8 },
  item: {
    flexDirection: "row",
    gap: 14,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  image: { width: 74, height: 94, borderRadius: 10 },
  itemCopy: { flex: 1, gap: 9 },
  name: { fontSize: 13, lineHeight: 20, fontWeight: "500" },
  variant: { color: AppColors.secondaryText, fontSize: 11 },
  price: { fontSize: 14, fontWeight: "600" },
  shipping: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    padding: 22,
    marginVertical: 4,
  },
  shippingTitle: { fontWeight: "600", fontSize: 14, marginBottom: 12 },
  address: { color: AppColors.secondaryText, lineHeight: 24, fontSize: 13 },
});
