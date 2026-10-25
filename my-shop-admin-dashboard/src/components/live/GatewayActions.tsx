"use client";
import { FormEvent, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Action, Field } from "./Controls";
export default function GatewayActions({
  order,
  onUpdate,
}: {
  order: {
    id: string;
    paymentMethod?: string;
    paymentStatus: string;
    collectedMinor: number;
    refundedMinor: number;
    version: number;
  };
  onUpdate: () => Promise<void>;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [refund, setRefund] = useState(false);
  const intent = useRef("");
  if (order.paymentMethod !== "sslcommerz") return null;
  async function reconcile() {
    setBusy(true);
    try {
      const result = await api<{ status: string }>(
        `admin/orders/${order.id}/payment-reconcile`,
        { method: "POST" },
      );
      setMessage(`Provider payment status: ${result.status}`);
      await onUpdate();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Reconciliation failed");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const r = await api<{ id: string; status: string }>(
        `admin/orders/${order.id}/gateway-refunds`,
        {
          method: "POST",
          headers: { "Idempotency-Key": intent.current },
          body: JSON.stringify({
            expectedVersion: order.version,
            amountMinor: Math.round(Number(f.get("amount")) * 100),
            reason: f.get("reason"),
            currentPassword: f.get("password"),
          }),
        },
      );
      setMessage(
        `Refund ${r.id}: ${r.status}. Only a provider-confirmed refund updates the balance.`,
      );
      setRefund(false);
      await onUpdate();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="border rounded p-4 space-y-3">
      <h3 className="font-bold">SSLCommerz payment</h3>
      <p>{message}</p>
      <Action disabled={busy} onClick={reconcile}>
        Reconcile payment
      </Action>
      {order.collectedMinor > order.refundedMinor && (
        <Action
          onClick={() => {
            intent.current = crypto.randomUUID();
            setRefund(true);
          }}
        >
          Request online refund
        </Action>
      )}
      {refund && (
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Refund amount (BDT)"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
          />
          <Field label="Reason" name="reason" required minLength={5} />
          <Field
            label="Current password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Action disabled={busy}>Send refund to gateway</Action>
        </form>
      )}
    </div>
  );
}
