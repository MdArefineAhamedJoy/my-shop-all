import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Input, Notice, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { useShop } from "@/hooks/useShop";

export function Newsletter() {
  const { dispatch } = useShop();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const save = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    dispatch({ type: "newsletter", email: email.trim() });
    setSaved(true);
    setError("");
  };
  return (
    <View style={styles.panel}>
      <Text style={styles.eyebrow}>THE STYLE CIRCLE</Text>
      <Text style={styles.title}>Good style. Great company.</Text>
      <Text style={styles.copy}>
        A first look at new arrivals, thoughtful edits and your next favorite.
      </Text>
      <Input
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setSaved(false);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        error={error}
      />
      <Button title="Join the circle" variant="dark" onPress={save} />
      {saved && (
        <Notice tone="success">
          Your email is saved in this preview. Newsletter delivery is not
          connected yet.
        </Notice>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  panel: {
    margin: 20,
    marginBottom: 32,
    padding: 24,
    borderRadius: 20,
    backgroundColor: AppColors.primaryLight,
    gap: 14,
  },
  eyebrow: {
    color: AppColors.primaryDark,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    lineHeight: 33,
    letterSpacing: -0.8,
  },
  copy: {
    color: AppColors.secondaryText,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 6,
  },
});
