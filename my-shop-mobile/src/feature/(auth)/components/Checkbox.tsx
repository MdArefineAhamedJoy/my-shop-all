import { Pressable, StyleSheet, View } from "react-native";
import { AppColors } from "@/constants";
import { Icon, Text } from "@/components/ui";

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={onChange}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.checked]}>
        {checked && <Icon name="checkmark" color="white" size={14} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    minHeight: 44,
    flexShrink: 1,
  },
  box: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checked: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  label: {
    color: AppColors.secondaryText,
    fontSize: 12,
    lineHeight: 19,
    flexShrink: 1,
  },
});
