import { StyleSheet, View } from "react-native";
import type { Control } from "react-hook-form";
import { FormField, Input } from "@/components/ui";
import type { Address } from "@/types/shop";

export function AddressFields({ control }: { control: Control<Address> }) {
  return (
    <View>
      <FormField
        control={control}
        name="email"
        label="Email address"
        icon="mail-outline"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <FormField
            control={control}
            name="firstName"
            label="First name"
            placeholder="First name"
            autoComplete="given-name"
          />
        </View>
        <View style={styles.half}>
          <FormField
            control={control}
            name="lastName"
            label="Last name"
            placeholder="Last name"
            autoComplete="family-name"
          />
        </View>
      </View>
      <Input label="Country" value="Bangladesh" editable={false} />
      <FormField
        control={control}
        name="address"
        label="Street address"
        placeholder="House, road, area, apartment"
        autoComplete="street-address"
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <FormField
            control={control}
            name="city"
            label="City"
            placeholder="Dhaka"
          />
        </View>
        <View style={styles.half}>
          <FormField
            control={control}
            name="postalCode"
            label="Postal code"
            placeholder="1207"
            keyboardType="number-pad"
            maxLength={4}
            autoComplete="postal-code"
          />
        </View>
      </View>
      <FormField
        control={control}
        name="phone"
        label="Mobile number"
        icon="call-outline"
        placeholder="01XXXXXXXXX"
        keyboardType="phone-pad"
        autoComplete="tel"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
});
