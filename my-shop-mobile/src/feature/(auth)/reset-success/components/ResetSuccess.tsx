import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Notice } from "@/components/ui";
import { AuthFormScreen } from "../../components/AuthFormScreen";

export default function ResetSuccess() {
  return (
    <AuthFormScreen
      title="You're all set."
      subtitle="The password reset preview is complete. You can return to sign in."
      icon="checkmark-circle-outline"
    >
      <View style={styles.notice}>
        <Notice tone="success">
          No real password was changed. Your new password was not saved or sent
          anywhere.
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
