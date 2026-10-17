import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useForm } from "react-hook-form";
import { Button, FormField, Notice, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { useLogin } from "../../hooks/useAuth";
import { loginSchema, type LoginValues } from "../../schemas/authSchemas";
import { Checkbox } from "../../components/Checkbox";

export function LoginForm() {
  const [remember, setRemember] = useState(true);
  const login = useLogin();
  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });
  return (
    <View>
      <FormField
        control={control}
        name="email"
        label="Email address"
        icon="mail-outline"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
      />
      <FormField
        control={control}
        name="password"
        label="Password"
        icon="lock-closed-outline"
        placeholder="Enter your password"
        isPassword
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        onSubmitEditing={handleSubmit((values) =>
          login.mutate({ ...values, remember })
        )}
      />
      <View style={styles.options}>
        <Checkbox
          label="Remember me"
          checked={remember}
          onChange={() => setRemember((v) => !v)}
        />
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push("/forgot-password")}
          style={styles.link}
        >
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>
      </View>
      {login.error && (
        <View style={styles.error}>
          <Notice tone="error">{login.error.message}</Notice>
        </View>
      )}
      <Button
        title="Sign in"
        icon="arrow-forward"
        loading={login.isPending}
        onPress={handleSubmit((values) =>
          login.mutate({ ...values, remember })
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  options: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  link: { minHeight: 44, justifyContent: "center" },
  forgot: { fontSize: 12, fontWeight: "600", color: AppColors.primaryDark },
  error: { marginBottom: 18 },
});
