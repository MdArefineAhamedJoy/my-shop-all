import { StyleSheet, Text as NativeText, type TextProps } from "react-native";
import { AppColors, fonts } from "@/constants";

export function Text({ style, ...props }: TextProps) {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  const family =
    weight === "800" || weight === "900"
      ? fonts.extrabold
      : weight === "bold" || weight === "700"
        ? fonts.bold
        : weight === "600"
          ? fonts.semibold
          : weight === "500"
            ? fonts.medium
            : fonts.regular;
  return (
    <NativeText
      {...props}
      style={[
        { color: AppColors.text, fontSize: 14, fontFamily: family },
        style,
      ]}
    />
  );
}
