import {
  ImageBackground,
  StyleSheet,
  type ImageBackgroundProps,
} from "react-native";

// ImageBackground otherwise reapplies percentage container dimensions to its child.
export function BackgroundImage({
  imageStyle,
  ...props
}: ImageBackgroundProps) {
  return <ImageBackground {...props} imageStyle={[styles.fill, imageStyle]} />;
}
const styles = StyleSheet.create({ fill: { width: "100%", height: "100%" } });
