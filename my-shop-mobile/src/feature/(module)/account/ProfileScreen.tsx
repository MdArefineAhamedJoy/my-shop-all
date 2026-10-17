import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { z } from "zod";
import { Screen } from "@/components/layout/Screen";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { Button, FormField, Notice } from "@/components/ui";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { addressSchema } from "@/schemas/addressSchema";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.union([z.literal(""), addressSchema.shape.phone]),
});
type ProfileValues = z.infer<typeof schema>;
export default function ProfileScreen() {
  const { user, updateProfile } = useSessionStatus();
  const { control, handleSubmit } = useForm<ProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });
  const save = useMutation({
    mutationFn: async (values: ProfileValues) => {
      if (!user) throw new Error("Please sign in again.");
      await updateProfile({ ...user, ...values });
    },
  });
  return (
    <Screen>
      <View style={styles.form}>
        <SectionHeading
          title="The details about you."
          subtitle="Keep your preview profile up to date."
        />
        <FormField
          control={control}
          name="name"
          label="Full name"
          icon="person-outline"
          autoComplete="name"
        />
        <FormField
          control={control}
          name="email"
          label="Email address"
          icon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <FormField
          control={control}
          name="phone"
          label="Mobile number (optional)"
          icon="call-outline"
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        {save.error && <Notice tone="error">{save.error.message}</Notice>}
        {save.isSuccess && (
          <Notice tone="success">Your preview profile has been updated.</Notice>
        )}
        <View style={styles.button}>
          <Button
            title="Save changes"
            loading={save.isPending}
            onPress={handleSubmit((values) => save.mutate(values))}
          />
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  form: { maxWidth: 560, width: "100%", alignSelf: "center", paddingTop: 14 },
  button: { marginTop: 16 },
});
