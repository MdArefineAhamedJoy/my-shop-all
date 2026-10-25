import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text, type IconName } from "@/components/ui";
import { AppColors } from "@/constants";

const methods: {
  id: string;
  title: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: "cod",
    title: "Cash on delivery",
    description: "Pay when your order arrives",
    icon: "cash-outline",
  },
  {
    id: "bkash",
    title: "bKash",
    description: "Mobile wallet",
    icon: "phone-portrait-outline",
  },
  {
    id: "nagad",
    title: "Nagad",
    description: "Mobile wallet",
    icon: "phone-portrait-outline",
  },
  {
    id: "sslcommerz",
    title: "Card / bKash / Nagad",
    description: "Continue to the secure payment provider",
    icon: "card-outline",
  },
];
export function PaymentOptions({
  selected,
  onSelect,
  enabled = ["cod"],
}: {
  selected: string;
  onSelect: (value: string) => void;
  enabled?: string[];
}) {
  return (
    <View style={styles.options}>
      {methods
        .filter((method) => enabled.includes(method.id))
        .map((method) => (
          <Pressable
            key={method.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === method.id }}
            onPress={() => onSelect(method.id)}
            style={[styles.option, selected === method.id && styles.selected]}
          >
            <View style={styles.icon}>
              <Icon
                name={method.icon}
                color={
                  selected === method.id
                    ? AppColors.primaryDark
                    : AppColors.secondaryText
                }
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{method.title}</Text>
              <Text style={styles.subtitle}>{method.description}</Text>
            </View>
            <Icon
              name={
                selected === method.id ? "radio-button-on" : "radio-button-off"
              }
              size={21}
              color={
                selected === method.id
                  ? AppColors.primaryDark
                  : AppColors.border
              }
            />
          </Pressable>
        ))}
    </View>
  );
}
const styles = StyleSheet.create({
  options: { gap: 12 },
  option: {
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primaryLight,
  },
  icon: { width: 38, alignItems: "center" },
  copy: { flex: 1 },
  title: { fontSize: 13, fontWeight: "600" },
  subtitle: { fontSize: 11, color: AppColors.secondaryText, marginTop: 5 },
});
