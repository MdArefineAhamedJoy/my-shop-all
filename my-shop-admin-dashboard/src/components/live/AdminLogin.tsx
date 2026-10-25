"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
export default function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await api("auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
          mfaCode: f.get("mfaCode"),
        }),
      });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 grid place-items-center px-6">
      <form
        onSubmit={submit}
        className="bg-white border rounded-2xl shadow-sm p-8 w-full max-w-md space-y-5"
      >
        <p className="text-sm font-bold tracking-widest">MYSHOP / ADMIN</p>
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="text-slate-500">
          Sign in with your staff account and authenticator.
        </p>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {[
          ["email", "Email", "email"],
          ["password", "Password", "password"],
          ["mfaCode", "Authenticator code", "text"],
        ].map(([name, label, type]) => (
          <label key={name} className="block text-sm font-medium">
            {label}
            <input
              required
              name={name}
              type={type}
              autoComplete={
                name === "mfaCode"
                  ? "one-time-code"
                  : name === "password"
                    ? "current-password"
                    : "email"
              }
              pattern={name === "mfaCode" ? "[0-9]{6}" : undefined}
              className="block border rounded-lg p-3 mt-2 w-full"
            />
          </label>
        ))}
        <button
          disabled={busy}
          className="w-full bg-slate-950 text-white p-3 rounded-lg"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <a href="/recover" className="text-sm underline">
          Forgot password?
        </a>
      </form>
    </main>
  );
}
