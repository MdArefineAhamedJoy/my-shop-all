"use client";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
export default function RecoverPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await api(
        f.get("token")
          ? "auth/password-reset/complete"
          : "auth/password-reset/request",
        {
          method: "POST",
          body: JSON.stringify(
            f.get("token")
              ? { token: f.get("token"), newPassword: f.get("password") }
              : { email: f.get("email") },
          ),
        },
      );
      setMessage(
        f.get("token")
          ? "Password changed. You can now sign in."
          : "If your email is registered, a reset message will arrive.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="max-w-lg mx-auto py-32 px-5">
      <h1 className="text-3xl font-serif mb-6">Recover your account</h1>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          Email
          <input
            name="email"
            type="email"
            className="border p-3 w-full rounded mt-1"
          />
        </label>
        <p className="text-sm">
          Request an email first, then paste its one-time token below to set
          your new password.
        </p>
        <label className="block">
          Reset token
          <input
            name="token"
            defaultValue={
              typeof window === "undefined"
                ? ""
                : new URLSearchParams(location.search).get("token") || ""
            }
            className="border p-3 w-full rounded mt-1"
          />
        </label>
        <label className="block">
          New password
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            className="border p-3 w-full rounded mt-1"
          />
        </label>
        <button
          disabled={busy}
          className="bg-black text-white w-full p-3 rounded"
        >
          Continue
        </button>
      </form>
      <p role="status" className="mt-4">
        {message}
      </p>
      <a href="/login" className="underline">
        Back to sign in
      </a>
    </main>
  );
}
