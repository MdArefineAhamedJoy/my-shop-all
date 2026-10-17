import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Button, FormField, Notice } from "@/components/ui";
import { AuthFormScreen } from "../../components/AuthFormScreen";
import { AuthFooter } from "../../components/AuthFooter";
import { useForgotPassword } from "../../hooks/useAuth";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../../schemas/authSchemas";

export default function ForgotPassword() {
  const reset = useForgotPassword();
  const { control, handleSubmit } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  return (
    <AuthFormScreen
      title="Forgot your password?"
      subtitle="Enter your account email to continue to the verification step."
      icon="key-outline"
    >
      <FormField
        control={control}
        name="email"
        label="Email address"
        placeholder="you@example.com"
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      {reset.error && (
        <View style={styles.error}>
          <Notice tone="error">{reset.error.message}</Notice>
        </View>
      )}
      <Button
        title="Continue"
        loading={reset.isPending}
        onPress={handleSubmit((values) => reset.mutate(values.email))}
      />
      <AuthFooter
        text="Remember your password?"
        action="Back to sign in"
        href="/login"
      />
    </AuthFormScreen>
  );
}
const styles = StyleSheet.create({ error: { marginBottom: 18 } });
