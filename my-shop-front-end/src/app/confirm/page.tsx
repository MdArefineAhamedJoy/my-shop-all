"use client";
import { use, useState } from "react";
import { api } from "@/lib/api";
export default function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ purpose?: string; token?: string }>;
}) {
  const params = use(searchParams);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const purpose = params.purpose;
  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      const path =
        purpose === "verify"
          ? "auth/email-verification/complete"
          : purpose === "newsletter"
            ? "newsletter/confirm"
            : purpose === "unsubscribe"
              ? "newsletter/unsubscribe"
              : null;
      if (!path) throw new Error("Unknown confirmation request");
      await api(path, {
        method: "POST",
        body: JSON.stringify({ token: params.token }),
      });
      setMessage(
        purpose === "unsubscribe"
          ? "You have unsubscribed."
          : "Confirmed. Thank you.",
      );
      history.replaceState(null, "", "/confirm");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Confirmation failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="max-w-lg mx-auto py-32 px-5 space-y-5">
      <h1 className="text-3xl font-serif">
        {purpose === "unsubscribe" ? "Unsubscribe" : "Confirm your request"}
      </h1>
      <p role="status">
        {message ||
          "Use the button below to complete the request from your email."}
      </p>
      {!message && (
        <button
          disabled={busy || !params.token}
          onClick={confirm}
          className="bg-black text-white p-3 rounded"
        >
          {busy ? "Working…" : "Confirm"}
        </button>
      )}
      <a className="block underline" href="/account">
        Your account
      </a>
    </main>
  );
}
