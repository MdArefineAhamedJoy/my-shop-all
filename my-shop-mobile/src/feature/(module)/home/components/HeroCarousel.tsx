import { BackgroundImage } from "@/components/ui/BackgroundImage";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button, Text } from "@/components/ui";
import { heroSlides } from "@/data/storefront";
import { imageSource } from "@/data/images";
import { useResponsive } from "@/hooks/useResponsive";

export function HeroCarousel() {
  const { contentWidth, isWide } = useResponsive();
  const width = contentWidth - 40;
  const [index, setIndex] = useState(0);
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    const timer = setInterval(
      () => setIndex((value) => (value + 1) % heroSlides.length),
      6000
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ x: index * width, animated: true });
  }, [index, width]);
  return (
    <View style={styles.container}>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
      >
        {heroSlides.map((slide) => (
          <BackgroundImage
            key={slide.title}
            source={imageSource(slide.image)}
            style={[styles.slide, { width }]}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.75)"]}
              style={styles.overlay}
            >
              <Text style={styles.eyebrow}>{slide.subtitle}</Text>
              <Text style={[styles.title, isWide && styles.wideTitle]}>
                {slide.title}
              </Text>
              <Text style={styles.subtitle}>
                Thoughtfully chosen. Effortlessly you.
              </Text>
              <Button
                title={slide.cta}
                icon="arrow-forward"
                variant="secondary"
                style={styles.cta}
                onPress={() =>
                  router.push({
                    pathname: "/shop",
                    params: {
                      tag: slide.tag,
                      category: slide.category,
                      gender: "",
                    },
                  })
                }
              />
            </LinearGradient>
          </BackgroundImage>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {heroSlides.map((_, slideIndex) => (
          <Pressable
            key={slideIndex}
            accessibilityRole="button"
            accessibilityLabel={`Show banner ${slideIndex + 1}`}
            accessibilityState={{ selected: index === slideIndex }}
            onPress={() => setIndex(slideIndex)}
            style={styles.dotTouch}
          >
            <View
              style={[styles.dot, index === slideIndex && styles.current]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#292524",
  },
  slide: { height: 410 },
  overlay: {
    flex: 1,
    padding: 26,
    justifyContent: "flex-end",
    paddingBottom: 58,
    alignItems: "flex-start",
  },
  eyebrow: {
    color: "#FDBA74",
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: "600",
    marginBottom: 16,
  },
  title: {
    color: "white",
    fontSize: 39,
    lineHeight: 46,
    letterSpacing: -1.7,
    fontWeight: "700",
  },
  wideTitle: { fontSize: 52, lineHeight: 60 },
  subtitle: { color: "#E2E8F0", fontSize: 12, marginTop: 12, marginBottom: 22 },
  cta: { minHeight: 46, paddingVertical: 11, borderRadius: 8 },
  pagination: {
    position: "absolute",
    bottom: 9,
    left: 18,
    flexDirection: "row",
  },
  dotTouch: {
    width: 30,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { height: 5, width: 5, borderRadius: 3, backgroundColor: "#FFFFFF80" },
  current: { backgroundColor: "#FFFFFF", width: 22 },
});
