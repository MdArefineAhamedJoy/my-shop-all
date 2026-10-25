import { StyleSheet, View } from "react-native";
import type { PropsWithChildren } from "react";
import { AppColors } from "@/constants";
import { Text } from "@/components/ui";
import type { CartItem } from "@/types/shop";
import { money, totals } from "@/utils/commerce";

export function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.value, bold && styles.total]}>{value}</Text>
    </View>
  );
}
export function OrderSummary({
  items,
  children,
  serverTotals,
}: PropsWithChildren<{
  items: CartItem[];
  serverTotals?: {
    subtotalMinor: number;
    discountMinor: number;
    shippingMinor: number;
    taxMinor: number;
    totalMinor: number;
  };
}>) {
  const local = totals(items);
  const subtotal = serverTotals
      ? serverTotals.subtotalMinor / 100
      : local.subtotal,
    tax = serverTotals ? serverTotals.taxMinor / 100 : 0,
    total = serverTotals ? serverTotals.totalMinor / 100 : local.total;
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Order summary</Text>
      <SummaryRow label="Subtotal" value={money(subtotal)} />
      <SummaryRow
        label="Tax"
        value={serverTotals ? money(tax) : "Calculated at checkout"}
      />
      <SummaryRow
        label="Shipping"
        value={
          serverTotals
            ? money(serverTotals.shippingMinor / 100)
            : "Calculated at checkout"
        }
      />
      {!!serverTotals?.discountMinor && (
        <SummaryRow
          label="Discount"
          value={money(-serverTotals.discountMinor / 100)}
        />
      )}
      <View style={styles.rule} />
      <SummaryRow label="Total" value={money(total)} bold />
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: {
    backgroundColor: AppColors.background,
    borderRadius: 18,
    padding: 22,
    gap: 17,
  },
  heading: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  row: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { flex: 1, color: AppColors.secondaryText, fontSize: 13 },
  value: { fontWeight: "500", fontSize: 13, flexShrink: 1, textAlign: "right" },
  bold: { color: AppColors.text, fontWeight: "600", fontSize: 16 },
  total: { fontWeight: "700", fontSize: 22 },
  rule: { height: 1, backgroundColor: AppColors.border },
});
