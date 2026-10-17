import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "@/components/ui";
import { AppColors } from "@/constants";

export function QuantitySelector({
  value,
  onChange,
  max = 99,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  return (
    <View style={styles.row}>
      <IconButton
        name="remove"
        label="Decrease quantity"
        disabled={value <= 1}
        onPress={() => onChange(Math.max(1, value - 1))}
      />
      <Text accessibilityLabel={`Quantity ${value}`} style={styles.value}>
        {value}
      </Text>
      <IconButton
        name="add"
        label="Increase quantity"
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  value: { fontSize: 13, fontWeight: "600", minWidth: 24, textAlign: "center" },
});
