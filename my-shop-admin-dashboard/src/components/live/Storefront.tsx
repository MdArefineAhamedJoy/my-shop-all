"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Action, Field, Notice, control } from "./Controls";
interface Config {
  storeName: string;
  announcement?: string;
  contactEmail: string;
  contactPhone: string;
  banners: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    target: string;
  }[];
}
export default function Storefront() {
  const [value, setValue] = useState<Config | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    api<Config>("storefront")
      .then(setValue)
      .catch((e) => setError(e.message));
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const config = {
        storeName: f.get("name"),
        announcement: f.get("announcement"),
        contactEmail: f.get("email"),
        contactPhone: f.get("phone"),
        banners: f.get("image")
          ? [
              {
                title: f.get("title"),
                imageUrl: f.get("image"),
                target: f.get("target"),
              },
            ]
          : [],
      };
      const draft = await api<{ id: string; version: number }>(
        "admin/storefront/draft",
        { method: "POST", body: JSON.stringify(config) },
      );
      await api(`admin/storefront/${draft.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: draft.version }),
      });
      setSaved(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publication failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-semibold">Storefront</h1>
      <Notice error={error} />
      {saved && <p role="status">Storefront published.</p>}
      {value && (
        <form
          onSubmit={save}
          className="bg-white border rounded-xl p-6 grid sm:grid-cols-2 gap-4"
        >
          <Field
            label="Store name"
            name="name"
            defaultValue={value.storeName}
            required
          />
          <Field
            label="Announcement"
            name="announcement"
            defaultValue={value.announcement}
          />
          <Field
            label="Contact email"
            name="email"
            type="email"
            defaultValue={value.contactEmail}
            required
          />
          <Field
            label="Contact phone"
            name="phone"
            defaultValue={value.contactPhone}
            required
          />
          <Field
            label="Banner title"
            name="title"
            defaultValue={value.banners[0]?.title}
          />
          <Field
            label="Banner image URL"
            name="image"
            type="url"
            defaultValue={value.banners[0]?.imageUrl}
          />
          <label>
            Banner destination
            <select
              name="target"
              defaultValue={value.banners[0]?.target || "/shop"}
              className={control}
            >
              {["/shop", "/men", "/women", "/new-arrivals"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <Action disabled={busy}>Publish storefront</Action>
        </form>
      )}
    </section>
  );
}
