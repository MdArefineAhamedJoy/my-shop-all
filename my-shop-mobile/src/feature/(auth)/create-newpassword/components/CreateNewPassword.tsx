import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect } from "expo-router";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Button, FormField, Notice } from "@/components/ui";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { AuthFormScreen } from "../../components/AuthFormScreen";
import { useResetPassword } from "../../hooks/useAuth";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "../../schemas/authSchemas";

export default function CreateNewPassword() {
  const { challenge } = useSessionStatus();
  const reset = useResetPassword();
  const { control, handleSubmit } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  if (!challenge?.verified) return <Redirect href="/forgot-password" />;
  return (
    <AuthFormScreen
      title="A fresh start."
      subtitle="Choose a new password for your account."
      icon="lock-closed-outline"
    >
      <FormField
        control={control}
        name="password"
        label="New password"
        isPassword
        placeholder="Create a new password"
        hint="Use at least 12 characters."
        autoComplete="new-password"
        autoCapitalize="none"
      />
      <FormField
        control={control}
        name="confirmPassword"
        label="Confirm new password"
        isPassword
        placeholder="Enter your new password again"
        autoComplete="new-password"
        autoCapitalize="none"
      />
      {reset.error && (
        <View style={styles.notice}>
          <Notice tone="error">{reset.error.message}</Notice>
        </View>
      )}
      <Button
        title="Reset password"
        loading={reset.isPending}
        onPress={handleSubmit((values) => reset.mutate(values.password))}
      />
    </AuthFormScreen>
  );
}
const styles = StyleSheet.create({ notice: { marginBottom: 20 } });
