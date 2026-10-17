import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Button, FormField, Notice, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { authService, PREVIEW_OTP } from "@/services/authService";
import { AuthFormScreen } from "../../components/AuthFormScreen";
import { AuthFooter } from "../../components/AuthFooter";
import { useVerifyCode } from "../../hooks/useAuth";
import {
  verificationSchema,
  type VerificationValues,
} from "../../schemas/authSchemas";

export default function OtpVerification() {
  const { challenge, setChallenge } = useSessionStatus();
  const verify = useVerifyCode();
  const [seconds, setSeconds] = useState(30);
  const { control, handleSubmit, reset } = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { code: "" },
  });
  const resend = useMutation({
    mutationFn: () => authService.requestReset(challenge?.email ?? ""),
    onSuccess: (value) => {
      setChallenge(value);
      setSeconds(30);
      reset();
      verify.reset();
    },
  });
  useEffect(() => {
    const timer = setInterval(
      () => setSeconds((v) => Math.max(0, v - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, []);
  if (!challenge) return <Redirect href="/forgot-password" />;
  return (
    <AuthFormScreen
      title="Check your code."
      subtitle={`Continue with the 6 digit verification code for ${challenge.email}.`}
      icon="mail-open-outline"
    >
      <View style={styles.notice}>
        <Notice>{`Preview code: ${PREVIEW_OTP}. No email is sent in this frontend preview.`}</Notice>
      </View>
      <FormField
        control={control}
        name="code"
        label="Verification code"
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        style={styles.code}
      />
      {(verify.error || resend.error) && (
        <View style={styles.notice}>
          <Notice tone="error">
            {verify.error?.message || resend.error?.message || ""}
          </Notice>
        </View>
      )}
      <Button
        title="Verify code"
        loading={verify.isPending}
        onPress={handleSubmit((values) => verify.mutate(values.code))}
      />
      <Pressable
        accessibilityRole="button"
        disabled={seconds > 0 || resend.isPending}
        onPress={() => resend.mutate()}
        style={styles.resend}
      >
        <Text
          style={[
            styles.resendText,
            seconds > 0 && { color: AppColors.secondaryText },
          ]}
        >
          {seconds > 0 ? `Request another code in ${seconds}s` : "Resend code"}
        </Text>
      </Pressable>
      <AuthFooter
        text="Wrong email?"
        action="Change email"
        href="/forgot-password"
      />
    </AuthFormScreen>
  );
}
const styles = StyleSheet.create({
  notice: { marginBottom: 20 },
  code: { fontSize: 26, letterSpacing: 14, textAlign: "center" },
  resend: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  resendText: { fontSize: 12, fontWeight: "600", color: AppColors.primaryDark },
});
