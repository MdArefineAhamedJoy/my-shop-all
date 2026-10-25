"use client";
import { useState } from "react";
import { api } from "@/lib/api";
export function PaymentActions({
  order,
  onUpdate,
}: {
  order: {
    id: string;
    paymentMethod?: string;
    paymentStatus: string;
    status: string;
  };
  onUpdate: () => Promise<void>;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  if (
    order.paymentMethod !== "sslcommerz" ||
    order.paymentStatus !== "unpaid" ||
    order.status === "cancelled"
  )
    return null;
  async function act(start: boolean) {
    setBusy(true);
    try {
      if (start) {
        const session = await api<{ checkoutUrl: string }>(
          `orders/${order.id}/payment-session`,
          { method: "POST" },
        );
        location.assign(session.checkoutUrl);
      } else {
        const result = await api<{ status: string }>(
          `orders/${order.id}/payment-status`,
          { method: "POST" },
        );
        setMessage(
          `Payment: ${result.status}. Pending or unconfirmed payments may take time to reconcile.`,
        );
        await onUpdate();
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Payment unavailable");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="my-3 space-x-3">
      <button
        disabled={busy}
        onClick={() => void act(true)}
        className="underline"
      >
        Continue payment
      </button>
      <button
        disabled={busy}
        onClick={() => void act(false)}
        className="underline"
      >
        Check payment status
      </button>
      <p role="status">{message}</p>
    </div>
  );
}
