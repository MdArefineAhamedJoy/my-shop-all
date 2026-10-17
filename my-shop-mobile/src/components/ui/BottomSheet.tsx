import type { PropsWithChildren, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "@/constants";
import { IconButton } from "./IconButton";
import { Text } from "./Text";

interface BottomSheetProps extends PropsWithChildren {
  title: string;
  visible: boolean;
  onClose: () => void;
  footer?: ReactNode;
}
export function BottomSheet({
  title,
  visible,
  onClose,
  footer,
  children,
}: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <IconButton
              name="close"
              label={`Close ${title.toLowerCase()}`}
              onPress={onClose}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: AppColors.overlay,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    backgroundColor: AppColors.white,
    width: "100%",
    maxWidth: 600,
    maxHeight: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 3,
    backgroundColor: AppColors.border,
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 14,
    paddingVertical: 10,
  },
  title: { fontSize: 21, fontWeight: "700" },
  content: { padding: 24, paddingTop: 10 },
  footer: {
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderColor: AppColors.border,
  },
});
