import { StyleSheet, View } from "react-native";
import { AppColors } from "@/constants";
import { Icon } from "./Icon";
import { Text } from "./Text";

export function Notice({
  children,
  tone = "info",
}: {
  children: string;
  tone?: "info" | "error" | "success";
}) {
  const color =
    tone === "error"
      ? AppColors.error
      : tone === "success"
        ? AppColors.success
        : AppColors.primaryDark;
  const backgroundColor =
    tone === "error"
      ? AppColors.errorLight
      : tone === "success"
        ? AppColors.successLight
        : AppColors.primaryLight;
  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : undefined}
      style={[styles.box, { backgroundColor }]}
    >
      <Icon
        name={
          tone === "success"
            ? "checkmark-circle-outline"
            : "information-circle-outline"
        }
        color={color}
        size={19}
      />
      <Text style={[styles.text, { color }]}>{children}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  text: { flex: 1, fontSize: 12, lineHeight: 19 },
});
