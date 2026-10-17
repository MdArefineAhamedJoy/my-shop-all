import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors, layout } from "@/constants";

export function Screen({
  children,
  padded = true,
  footer,
  safeBottom = true,
}: PropsWithChildren<{
  padded?: boolean;
  footer?: ReactNode;
  safeBottom?: boolean;
}>) {
  return (
    <SafeAreaView edges={safeBottom ? ["bottom"] : []} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={[styles.content, padded && styles.padded]}>
            {children}
          </View>
        </ScrollView>
        {footer && (
          <View style={styles.footer}>
            <View style={styles.content}>{footer}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppColors.white },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  content: { width: "100%", maxWidth: layout.maxWidth, alignSelf: "center" },
  padded: { padding: layout.pagePadding },
  footer: {
    borderTopWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
});
