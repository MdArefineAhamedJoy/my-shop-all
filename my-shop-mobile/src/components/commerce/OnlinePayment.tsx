import { useState } from "react";
import * as Linking from "expo-linking";
import { api } from "@/services/api";
import { Button, Notice } from "@/components/ui";
import { View } from "react-native";
export function OnlinePayment({
  id,
  onRefresh,
}: {
  id: string;
  onRefresh: () => Promise<unknown>;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function act(start: boolean) {
    setBusy(true);
    try {
      if (start) {
        const value = await api<{ checkoutUrl: string }>(
          `orders/${id}/payment-session`,
          { method: "POST" }
        );
        await Linking.openURL(value.checkoutUrl);
      } else {
        const value = await api<{ status: string }>(
          `orders/${id}/payment-status`,
          { method: "POST" }
        );
        setMessage(`Payment: ${value.status}`);
        await onRefresh();
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Payment unavailable");
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 10, marginVertical: 16 }}>
      <Button
        title="Continue payment"
        disabled={busy}
        onPress={() => void act(true)}
      />
      <Button
        title="Check payment status"
        variant="secondary"
        disabled={busy}
        onPress={() => void act(false)}
      />
      {!!message && <Notice>{message}</Notice>}
    </View>
  );
}
