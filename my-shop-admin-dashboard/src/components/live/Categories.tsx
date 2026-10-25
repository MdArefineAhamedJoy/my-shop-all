"use client";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { useRows } from "./useRows";
import { Action, Field, Notice } from "./Controls";
interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  version: number;
  sortOrder: number;
}
export default function Categories() {
  const list = useRows<Category>("admin/categories");
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api(
        editing ? `admin/categories/${editing.id}` : "admin/categories",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify({
            name: f.get("name"),
            slug: f.get("slug"),
            active: f.get("active") === "on",
            ...(editing ? { expectedVersion: editing.version } : {}),
          }),
        },
      );
      setEditing(null);
      e.currentTarget?.reset();
      await list.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }
  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-semibold">Categories</h1>
      <Notice error={error || list.error} />
      <form
        key={editing?.id || "new"}
        onSubmit={save}
        className="bg-white border rounded-xl p-6 grid md:grid-cols-4 gap-4 items-end"
      >
        <Field
          label="Category name"
          name="name"
          defaultValue={editing?.name}
          required
        />
        <Field label="Slug" name="slug" defaultValue={editing?.slug} required />
        <label>
          <input
            name="active"
            type="checkbox"
            defaultChecked={editing?.active ?? true}
          />{" "}
          Active
        </label>
        <Action>{editing ? "Save category" : "Add category"}</Action>
      </form>
      {list.rows.map((c) => (
        <article
          key={c.id}
          className="bg-white border rounded-xl p-4 flex justify-between"
        >
          <span>
            {c.name} · {c.active ? "Active" : "Hidden"}
          </span>
          <Action onClick={() => setEditing(c)}>Edit</Action>
        </article>
      ))}
    </section>
  );
}
