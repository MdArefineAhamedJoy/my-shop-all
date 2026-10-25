"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Action, Field, Notice } from "./Controls";
interface Settings {
  version: number;
  shippingMinor: number;
  freeShippingThresholdMinor: number;
  taxBasisPoints: number;
  returnWindowDays: number;
}
export default function SettingsPage() {
  const [value, setValue] = useState<Settings | null>(null),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    api<Settings>("admin/settings")
      .then(setValue)
      .catch((e) => setError(e.message));
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      setValue(
        await api("admin/settings", {
          method: "PUT",
          body: JSON.stringify({
            expectedVersion: value?.version,
            shippingMinor: Math.round(Number(f.get("shipping")) * 100),
            freeShippingThresholdMinor: Math.round(Number(f.get("free")) * 100),
            taxBasisPoints: Math.round(Number(f.get("tax")) * 100),
            returnWindowDays: Number(f.get("days")),
          }),
        }),
      );
      setSaved(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }
  return (
    <section className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-semibold">Checkout settings</h1>
      <Notice error={error} />
      {saved && (
        <p role="status">
          Settings saved. Existing checkout quotes will need to be refreshed.
        </p>
      )}
      {value && (
        <form
          onSubmit={save}
          key={value.version}
          className="bg-white rounded-xl border p-6 space-y-5"
        >
          <Field
            label="Shipping fee (BDT)"
            name="shipping"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={value.shippingMinor / 100}
          />
          <Field
            label="Free delivery threshold (BDT)"
            name="free"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={value.freeShippingThresholdMinor / 100}
          />
          <Field
            label="Tax (%)"
            name="tax"
            type="number"
            step="0.01"
            min="0"
            max="100"
            required
            defaultValue={value.taxBasisPoints / 100}
          />
          <Field
            label="Return window (days)"
            name="days"
            type="number"
            min="1"
            max="365"
            required
            defaultValue={value.returnWindowDays}
          />
          <Action>Save policy</Action>
        </form>
      )}
    </section>
  );
}
