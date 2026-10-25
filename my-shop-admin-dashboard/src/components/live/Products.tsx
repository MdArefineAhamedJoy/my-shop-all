"use client";
import { FormEvent, useState } from "react";
import { api, ApiProduct } from "@/lib/api";
import { useRows } from "./useRows";
import { Action, Field, Notice, Pagination, control } from "./Controls";
type Category = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  version: number;
};
export default function Products() {
  const list = useRows<ApiProduct>("admin/products");
  const categories = useRows<Category>("admin/categories");
  const [editing, setEditing] = useState<ApiProduct | null | "new">(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const fields = {
        name: f.get("name"),
        slug: f.get("slug"),
        description: f.get("description"),
        categoryId: f.get("categoryId"),
        gender: f.get("gender"),
        images: String(f.get("image"))
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        tags: String(f.get("tags") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        isFeatured: f.get("featured") === "on",
        isNew: f.get("new") === "on",
      };
      const variants = String(f.get("sizes") || "M")
        .split(",")
        .map((size, i) => ({
          sku: `${f.get("sku")}-${i + 1}`,
          size: size.trim(),
          color: String(f.get("color") || "default"),
          priceMinor: Math.round(Number(f.get("price")) * 100),
        }));
      const row = await api<ApiProduct>(
        editing === "new"
          ? "admin/products"
          : `admin/products/${(editing as ApiProduct).id}`,
        {
          method: editing === "new" ? "POST" : "PATCH",
          body: JSON.stringify(
            editing === "new"
              ? { ...fields, variants }
              : { ...fields, expectedVersion: (editing as ApiProduct).version },
          ),
        },
      );
      setEditing(await api<ApiProduct>(`admin/products/${row.id}`));
      await list.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  async function status(p: ApiProduct, action: string) {
    try {
      await api(`admin/products/${p.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ expectedVersion: p.version }),
      });
      await list.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }
  async function stock(id: string) {
    try {
      const current = await api<{ available: number; version: number }>(
        `admin/inventory/${id}`,
      );
      const quantity = Number(
        prompt(
          `Current available stock: ${current.available}. Enter signed adjustment:`,
          "0",
        ),
      );
      if (!Number.isInteger(quantity) || !quantity) return;
      const reason = prompt("Reason for this adjustment");
      if (!reason) return;
      await api("admin/inventory/adjustments", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          variantId: id,
          quantity,
          reason,
          expectedVersion: current.version,
        }),
      });
      setError("");
      await list.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stock adjustment failed");
    }
  }
  async function price(id: string, version: number) {
    const amount = prompt("New unit price in BDT");
    if (amount === null) return;
    try {
      await api(`admin/variants/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          expectedVersion: version,
          priceMinor: Math.round(Number(amount) * 100),
        }),
      });
      if (editing && editing !== "new")
        setEditing(await api<ApiProduct>(`admin/products/${editing.id}`));
      await list.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Price update failed");
    }
  }
  const p = editing && editing !== "new" ? editing : null;
  return (
    <section className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-semibold">Products</h1>
        <Action onClick={() => setEditing("new")}>Add product</Action>
      </div>
      <Notice error={error || list.error} />
      {editing && (
        <section className="p-6 border bg-white rounded-xl space-y-5">
          <form
            key={p?.id || "new"}
            onSubmit={save}
            className="grid sm:grid-cols-2 gap-4"
          >
            <Field
              label="Product name"
              name="name"
              defaultValue={p?.name}
              required
            />
            <Field label="Slug" name="slug" defaultValue={p?.slug} required />
            <label>
              Description
              <textarea
                name="description"
                defaultValue={p?.description}
                minLength={10}
                required
                className={control}
              />
            </label>
            <label>
              Category
              <select
                name="categoryId"
                defaultValue={p?.categoryId}
                className={control}
                required
              >
                {categories.rows
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Gender
              <select
                name="gender"
                defaultValue={p?.gender || "unisex"}
                className={control}
              >
                {["unisex", "men", "women"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <Field
              label="Image URL"
              name="image"
              defaultValue={p?.images.join("\n")}
              required
            />
            <Field
              label="Tags (comma separated)"
              name="tags"
              defaultValue={p?.tags.join(",")}
            />
            <div>
              <label className="mr-4">
                <input
                  name="featured"
                  type="checkbox"
                  defaultChecked={p?.isFeatured}
                />{" "}
                Featured
              </label>
              <label>
                <input name="new" type="checkbox" defaultChecked={p?.isNew} />{" "}
                New arrival
              </label>
            </div>
            {!p && (
              <>
                <Field label="SKU prefix" name="sku" required />
                <Field
                  label="Sizes (comma separated)"
                  name="sizes"
                  defaultValue="S,M,L"
                  required
                />
                <Field
                  label="Color"
                  name="color"
                  defaultValue="navy"
                  required
                />
                <Field
                  label="Unit price (BDT)"
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              </>
            )}
            <div className="flex gap-3">
              <Action disabled={busy}>Save draft</Action>
              <Action onClick={() => setEditing(null)}>Close</Action>
            </div>
          </form>
          {p && (
            <div className="space-y-3">
              <h2 className="font-semibold">Variants</h2>
              {p.variants.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-wrap justify-between gap-3 border rounded p-3"
                >
                  <span>
                    {v.sku} · {v.size}/{v.color} · BDT{" "}
                    {(v.priceMinor / 100).toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    <Action
                      onClick={() =>
                        price(
                          v.id,
                          (v as typeof v & { version: number }).version,
                        )
                      }
                    >
                      Edit price
                    </Action>
                    <Action onClick={() => stock(v.id)}>Adjust stock</Action>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      <div className="space-y-3">
        {list.loading && <p>Loading products…</p>}
        {list.rows.map((p) => (
          <article
            className="bg-white border rounded-xl p-5 flex flex-wrap justify-between gap-4"
            key={p.id}
          >
            <div>
              <strong>{p.name}</strong>
              <p className="text-sm text-slate-500">
                {p.slug} · {p.status}
              </p>
            </div>
            <div className="flex gap-2">
              <Action
                onClick={async () =>
                  setEditing(await api<ApiProduct>(`admin/products/${p.id}`))
                }
              >
                Edit
              </Action>
              <Action
                onClick={() =>
                  status(p, p.status === "published" ? "archive" : "publish")
                }
              >
                {p.status === "published" ? "Archive" : "Publish"}
              </Action>
            </div>
          </article>
        ))}
      </div>
      <Pagination {...list} />
    </section>
  );
}
