import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Button, FormField, Notice, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { Checkbox } from "../../components/Checkbox";
import { useRegister } from "../../hooks/useAuth";
import { registerSchema, type RegisterValues } from "../../schemas/authSchemas";

export function CreateAccountForm() {
  const register = useRegister();
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
  });
  const acceptedTerms = useWatch({ control, name: "acceptedTerms" });
  return (
    <View>
      <FormField
        control={control}
        name="name"
        label="Full name"
        icon="person-outline"
        placeholder="Your full name"
        autoComplete="name"
      />
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
        placeholder="Create a password"
        isPassword
        hint="Use at least 8 characters."
        autoCapitalize="none"
        autoComplete="new-password"
      />
      <FormField
        control={control}
        name="confirmPassword"
        label="Confirm password"
        icon="lock-closed-outline"
        placeholder="Enter your password again"
        isPassword
        autoCapitalize="none"
        autoComplete="new-password"
      />
      <View style={styles.terms}>
        <Checkbox
          checked={acceptedTerms}
          onChange={() =>
            setValue("acceptedTerms", !acceptedTerms, {
              shouldValidate: true,
            })
          }
          label="I agree to the Terms of use and Privacy policy."
        />
        {errors.acceptedTerms && (
          <Text accessibilityRole="alert" style={styles.error}>
            {errors.acceptedTerms.message}
          </Text>
        )}
      </View>
      {register.error && <Notice tone="error">{register.error.message}</Notice>}
      <Button
        title="Create account"
        icon="arrow-forward"
        loading={register.isPending}
        onPress={handleSubmit((values) => register.mutate(values))}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  terms: { marginBottom: 20 },
  error: { color: AppColors.error, fontSize: 12, lineHeight: 18 },
});
