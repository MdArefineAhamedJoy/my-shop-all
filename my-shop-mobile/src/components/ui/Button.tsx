import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { AppColors, fonts } from "@/constants";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "dark";
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}
export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
}: ButtonProps) {
  const light = variant === "secondary" || variant === "ghost";
  const color = light ? AppColors.text : AppColors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: !!(disabled || loading),
        busy: !!loading,
      }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        style,
        (pressed || disabled) && { opacity: disabled ? 0.45 : 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          <Text style={[styles.label, { color }]}>{title}</Text>
          {icon && <Icon name={icon} size={18} color={color} />}
        </>
      )}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  secondary: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.border,
  },
  ghost: { backgroundColor: "transparent", borderColor: "transparent" },
  dark: { backgroundColor: AppColors.text, borderColor: AppColors.text },
  label: { fontFamily: fonts.semibold, fontSize: 14, textAlign: "center" },
});
