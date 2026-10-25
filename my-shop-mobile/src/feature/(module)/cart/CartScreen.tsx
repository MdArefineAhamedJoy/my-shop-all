import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { Screen } from "@/components/layout/Screen";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Button, EmptyState, Icon, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { useShop } from "@/hooks/useShop";
import { useResponsive } from "@/hooks/useResponsive";
import { cartKey } from "@/utils/commerce";
import { CartItemRow } from "./components/CartItemRow";

export default function CartScreen() {
  const { state, count } = useShop();
  const { isWide } = useResponsive();
  if (!count)
    return (
      <Screen safeBottom={false}>
        <EmptyState
          title="Your bag is empty"
          description="Your next everyday favorite is waiting. Find a piece that feels like you."
          action="Explore the collection"
          onAction={() => router.navigate("/shop")}
        />
      </Screen>
    );
  return (
    <Screen
      safeBottom={false}
      footer={
        <Button
          title="Proceed to checkout"
          icon="arrow-forward"
          onPress={() => router.push("/checkout")}
        />
      }
    >
      <SectionHeading
        title="Shopping Bag"
        subtitle={`${count} pieces, thoughtfully picked by you.`}
      />
      <View style={[styles.layout, isWide && styles.wide]}>
        <View style={isWide && styles.items}>
          {state.cart.map((item) => (
            <CartItemRow key={cartKey(item)} item={item} />
          ))}
          <Button
            title="Continue shopping"
            variant="ghost"
            onPress={() => router.navigate("/shop")}
          />
        </View>
        <View style={isWide && styles.summary}>
          <OrderSummary items={state.cart}>
            <View style={styles.note}>
              <Icon
                name="lock-closed-outline"
                color={AppColors.secondaryText}
                size={14}
              />
              <Text style={styles.noteText}>
                Final shipping and tax are calculated at checkout.
              </Text>
            </View>
          </OrderSummary>
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  layout: { gap: 24 },
  wide: { flexDirection: "row", alignItems: "flex-start", gap: 36 },
  items: { flex: 1.5 },
  summary: { flex: 1 },
  note: { flexDirection: "row", gap: 8, alignItems: "center" },
  noteText: {
    fontSize: 10,
    lineHeight: 17,
    color: AppColors.secondaryText,
    flex: 1,
  },
});
