import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, IconButton, ProductImage } from "@/components/ui";
import { AppColors } from "@/constants";

export function ProductGallery({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enlarge product image"
        onPress={() => setZoom(true)}
      >
        <ProductImage
          path={images[index]}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.expand}>
          <Icon name="expand-outline" size={18} />
        </View>
      </Pressable>
      {images.length > 1 && (
        <ScrollView horizontal contentContainerStyle={styles.thumbnails}>
          {images.map((image, i) => (
            <Pressable
              key={image}
              accessibilityRole="button"
              accessibilityLabel={`Product image ${i + 1}`}
              onPress={() => setIndex(i)}
            >
              <ProductImage
                path={image}
                style={[styles.thumb, i === index && styles.selected]}
              />
            </Pressable>
          ))}
        </ScrollView>
      )}
      <Modal
        visible={zoom}
        onRequestClose={() => setZoom(false)}
        animationType="fade"
      >
        <SafeAreaView style={styles.zoom}>
          <View style={styles.close}>
            <IconButton
              name="close"
              label="Close product image"
              onPress={() => setZoom(false)}
            />
          </View>
          <ProductImage
            path={images[index]}
            resizeMode="contain"
            style={styles.fullImage}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  image: {
    width: "100%",
    aspectRatio: 0.92,
    height: undefined,
    borderRadius: 18,
    backgroundColor: AppColors.background,
  },
  expand: {
    position: "absolute",
    right: 14,
    bottom: 14,
    padding: 12,
    backgroundColor: AppColors.white,
    borderRadius: 25,
  },
  thumbnails: { gap: 10, paddingTop: 14 },
  thumb: {
    width: 66,
    height: 82,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: { borderColor: AppColors.primary },
  zoom: { flex: 1, backgroundColor: AppColors.white, padding: 16 },
  close: { alignItems: "flex-end" },
  fullImage: { flex: 1, width: "100%" },
});
