import { Pressable, StyleSheet, View } from "react-native";
import { AppColors } from "@/constants";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface IconButtonProps {
  name: IconName;
  label: string;
  onPress: () => void;
  badge?: number;
  selected?: boolean;
  disabled?: boolean;
}
export function IconButton({
  name,
  label,
  onPress,
  badge,
  selected,
  disabled,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        selected && styles.selected,
        (pressed || disabled) && { opacity: disabled ? 0.35 : 0.6 },
      ]}
    >
      <Icon
        name={name}
        color={selected ? AppColors.primaryDark : AppColors.text}
      />
      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.count}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  selected: { backgroundColor: AppColors.primaryLight },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  count: { color: AppColors.white, fontSize: 10, fontWeight: "700" },
});
