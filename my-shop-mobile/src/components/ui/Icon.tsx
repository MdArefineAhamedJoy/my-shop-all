import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { AppColors } from "@/constants";

export type IconName = ComponentProps<typeof Ionicons>["name"];
interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
}
export function Icon({ name, size = 22, color = AppColors.text }: IconProps) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessible={false}
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
