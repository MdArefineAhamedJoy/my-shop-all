import { BackgroundImage } from "@/components/ui/BackgroundImage";
import { router } from "expo-router";
import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Brand } from "@/components/layout/Brand";
import { Icon, IconButton, Text, type IconName } from "@/components/ui";
import { AppColors, layout } from "@/constants";
import { imageSource } from "@/data/images";
import { useResponsive } from "@/hooks/useResponsive";

interface AuthFormScreenProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  icon?: IconName;
  back?: boolean;
}
export function AuthFormScreen({
  children,
  title,
  subtitle,
  icon,
  back = true,
}: AuthFormScreenProps) {
  const { isWide } = useResponsive();
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.shell}>
          {isWide && (
            <BackgroundImage
              source={imageSource(
                "/images/collection_new_arrivals_model_1769622776953.png"
              )}
              style={styles.visual}
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.78)"]}
                style={styles.visualContent}
              >
                <Text style={styles.eyebrow}>THE MYSHOP WAY</Text>
                <Text style={styles.visualTitle}>
                  A little more you.{"\n"}Every single day.
                </Text>
                <Text style={styles.visualCopy}>
                  Discover thoughtful essentials and find your own kind of
                  style.
                </Text>
              </LinearGradient>
            </BackgroundImage>
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.form}>
              <View style={styles.top}>
                <Brand />
                {back && (
                  <IconButton
                    name="close"
                    label="Close sign in"
                    onPress={() => router.replace("/")}
                  />
                )}
              </View>
              <View style={styles.heading}>
                {icon && (
                  <View style={styles.icon}>
                    <Icon name={icon} size={27} color={AppColors.primaryDark} />
                  </View>
                )}
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              {children}
              <View style={styles.preview}>
                <View style={styles.dot} />
                <Text style={styles.previewText}>
                  Frontend preview · No live account or email service
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.white },
  shell: { flex: 1, flexDirection: "row" },
  visual: { width: "43%", backgroundColor: AppColors.text },
  visualContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 44,
    paddingBottom: 64,
  },
  eyebrow: {
    color: "#FDBA74",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 3,
  },
  visualTitle: {
    fontSize: 38,
    lineHeight: 48,
    fontWeight: "700",
    color: "white",
    marginTop: 20,
  },
  visualCopy: { color: "#E2E8F0", fontSize: 15, lineHeight: 25, marginTop: 20 },
  scroll: { flexGrow: 1, padding: 24, justifyContent: "center" },
  form: {
    width: "100%",
    maxWidth: layout.formWidth,
    alignSelf: "center",
    paddingVertical: 16,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 48,
  },
  heading: { marginBottom: 30 },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: AppColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { fontSize: 30, lineHeight: 39, fontWeight: "700", letterSpacing: -1 },
  subtitle: {
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 23,
    marginTop: 10,
  },
  preview: {
    marginTop: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
  },
  previewText: { color: AppColors.secondaryText, fontSize: 10, lineHeight: 18 },
});
