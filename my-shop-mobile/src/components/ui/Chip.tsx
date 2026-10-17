import { Pressable, StyleSheet } from "react-native";
import { AppColors } from "@/constants";
import { Text } from "./Text";

interface ChipProps {
  title: string;
  selected?: boolean;
  onPress: () => void;
}
export function Chip({ title, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.label, selected && { color: AppColors.white }]}>
        {title}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  chip: {
    minHeight: 42,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 100,
    backgroundColor: AppColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { backgroundColor: AppColors.text, borderColor: AppColors.text },
  label: { fontWeight: "500", fontSize: 12 },
});
