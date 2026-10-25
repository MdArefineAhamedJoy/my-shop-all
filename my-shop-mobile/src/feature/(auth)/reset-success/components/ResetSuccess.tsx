import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Notice } from "@/components/ui";
import { AuthFormScreen } from "../../components/AuthFormScreen";

export default function ResetSuccess() {
  return (
    <AuthFormScreen
      title="You're all set."
      subtitle="Your password has been changed. Sign in with your new password."
      icon="checkmark-circle-outline"
    >
      <View style={styles.notice}>
        <Notice tone="success">
          Your existing sessions have been revoked for account security.
        </Notice>
      </View>
      <Button
        title="Back to sign in"
        icon="arrow-forward"
        onPress={() => router.replace("/login")}
      />
    </AuthFormScreen>
  );
}
const styles = StyleSheet.create({ notice: { marginBottom: 24 } });
