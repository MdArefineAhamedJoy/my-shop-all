import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AddressFields } from "@/components/forms/AddressFields";
import { OrderSummary } from "@/components/commerce/OrderSummary";
import { Screen } from "@/components/layout/Screen";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Button, Chip, EmptyState, Icon, Notice, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { useResponsive } from "@/hooks/useResponsive";
import { useCheckout } from "./hooks/useCheckout";
import { PaymentOptions } from "./components/PaymentOptions";

export default function CheckoutScreen() {
  const state = useCheckout();
  const { isWide } = useResponsive();
  const address = state.form.getValues();
  if (!state.state.cart.length)
    return (
      <Screen>
        <EmptyState
          title="Your bag is empty"
          description="Add a piece to your bag before checking out."
          action="Explore the collection"
          onAction={() => router.replace("/shop")}
        />
      </Screen>
    );
  return (
    <Screen
      footer={
        <Button
          title={
            state.step === 1 ? "Continue to payment" : "Place preview order"
          }
          loading={state.order.isPending}
          icon="arrow-forward"
          onPress={() => void state.submit()}
        />
      }
    >
      <View style={styles.steps}>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.number}>1</Text>
          </View>
          <Text style={styles.stepLabel}>Shipping</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.step}>
          <View
            style={[styles.stepNumber, state.step === 1 && styles.inactive]}
          >
            <Text
              style={[styles.number, state.step === 1 && styles.inactiveText]}
            >
              2
            </Text>
          </View>
          <Text style={styles.stepLabel}>Payment</Text>
        </View>
      </View>
      <View style={styles.notice}>
        <Notice>
          Checkout preview. No payment is collected and no order is sent to the
          shop.
        </Notice>
      </View>
      <View style={[styles.layout, isWide && styles.wide]}>
        <View style={isWide && styles.form}>
          <SectionHeading
            title={
              state.step === 1 ? "Where should it go?" : "The final details."
            }
            subtitle={
              state.step === 1
                ? "Your delivery details, all in one place."
                : "Choose a payment method for this preview."
            }
          />
          {state.step === 1 ? (
            <>
              {!!state.state.addresses.length && (
                <View style={styles.saved}>
                  {state.state.addresses.map((saved) => (
                    <Chip
                      key={saved.id}
                      title={`Use ${saved.label}`}
                      onPress={() => state.form.reset(saved)}
                    />
                  ))}
                </View>
              )}
              <AddressFields control={state.form.control} />
            </>
          ) : (
            <>
              <View style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressTitle}>DELIVER TO</Text>
                  <Pressable
                    accessibilityRole="button"
                    style={styles.edit}
                    onPress={() => state.setStep(1)}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                </View>
                <Text style={styles.addressText}>
                  {address.firstName} {address.lastName}
                  {"\n"}
                  {address.address}
                  {"\n"}
                  {address.city} {address.postalCode}, Bangladesh{"\n"}
                  {address.phone}
                </Text>
              </View>
              <PaymentOptions
                selected={state.payment}
                onSelect={state.setPayment}
              />
            </>
          )}
          {state.order.error && (
            <Notice tone="error">{state.order.error.message}</Notice>
          )}
          <Button
            title={state.step === 1 ? "Return to bag" : "Back to shipping"}
            variant="ghost"
            onPress={() =>
              state.step === 1 ? router.replace("/cart") : state.setStep(1)
            }
          />
        </View>
        <View style={isWide && styles.summary}>
          <OrderSummary items={state.state.cart}>
            <View style={styles.secure}>
              <Icon
                name="lock-closed-outline"
                size={14}
                color={AppColors.secondaryText}
              />
              <Text style={styles.secureText}>
                Payment options are visual previews.
              </Text>
            </View>
          </OrderSummary>
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  steps: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingBottom: 26,
    paddingTop: 6,
  },
  step: { flexDirection: "row", gap: 8, alignItems: "center" },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 14,
    backgroundColor: AppColors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  number: { color: AppColors.white, fontSize: 11, fontWeight: "600" },
  inactive: { backgroundColor: AppColors.background },
  inactiveText: { color: AppColors.secondaryText },
  stepLabel: { fontSize: 12, fontWeight: "500" },
  stepLine: { height: 1, width: 40, backgroundColor: AppColors.border },
  notice: { marginBottom: 28 },
  layout: { gap: 28 },
  wide: { flexDirection: "row", gap: 40 },
  form: { flex: 1.4 },
  summary: { flex: 1 },
  saved: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 },
  addressCard: {
    padding: 20,
    borderRadius: 14,
    backgroundColor: AppColors.background,
    marginBottom: 24,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressTitle: { fontSize: 10, fontWeight: "600", letterSpacing: 1.5 },
  edit: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  editText: { color: AppColors.primaryDark, fontSize: 12, fontWeight: "600" },
  addressText: { fontSize: 13, color: AppColors.secondaryText, lineHeight: 23 },
  secure: { flexDirection: "row", gap: 8, alignItems: "center" },
  secureText: { fontSize: 10, color: AppColors.secondaryText, flex: 1 },
});
