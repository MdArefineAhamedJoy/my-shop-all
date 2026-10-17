import { useWindowDimensions } from "react-native";
import { layout } from "@/constants";

export function useResponsive() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, layout.maxWidth);
  return {
    width,
    contentWidth,
    isWide: width >= 800,
    columns: width >= 1000 ? 4 : width >= 700 ? 3 : 2,
    cardWidth: (contentWidth - 40 - 14) / 2,
  };
}
