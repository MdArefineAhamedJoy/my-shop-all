import { useState } from "react";
import { Image, StyleSheet, View, type ImageProps } from "react-native";
import { imageSource } from "@/data/images";
import { AppColors } from "@/constants";
import { Icon } from "./Icon";
import { Text } from "./Text";

export function ProductImage({
  path,
  ...props
}: Omit<ImageProps, "source"> & { path: string }) {
  return <ImageContent key={path} path={path} {...props} />;
}

function ImageContent({
  path,
  style,
  ...props
}: Omit<ImageProps, "source"> & { path: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <View style={[style, styles.fallback]}>
        <Icon name="image-outline" color={AppColors.secondaryText} />
        <Text style={styles.caption}>Image unavailable</Text>
      </View>
    );
  return (
    <View style={[style, styles.frame]}>
      <Image
        {...props}
        style={styles.image}
        source={imageSource(path)}
        onError={() => setFailed(true)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  frame: { overflow: "hidden" },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
  caption: { fontSize: 11, color: AppColors.secondaryText, marginTop: 8 },
});
