"use client";
import { FormEvent, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useRows } from "./useRows";
import { Action, Field, Notice, Pagination } from "./Controls";
interface Return {
  id: string;
  orderId: string;
  status: string;
  reason: string;
  version: number;
  lines: { orderLineId: string; quantity: number }[];
}
export default function Returns() {
  const list = useRows<Return>("admin/returns");
  const [selected, setSelected] = useState<Return | null>(null),
    [action, setAction] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const intent = useRef("");
  function choose(r: Return, a: string) {
    setSelected(r);
    setAction(a);
    intent.current = crypto.randomUUID();
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await api(`admin/returns/${selected.id}/${action}`, {
        method: "POST",
        headers: { "Idempotency-Key": intent.current },
        body: JSON.stringify({
          expectedVersion: selected.version,
          note: f.get("note"),
          ...(action === "inspect"
            ? {
                lines: selected.lines.map((l) => ({
                  orderLineId: l.orderLineId,
                  restockQuantity: Number(f.get(l.orderLineId)),
                })),
              }
            : {}),
        }),
      });
      setSelected(null);
      setError("");
      await list.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Return update failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-semibold">Returns</h1>
      <Notice error={error || list.error} />
      {selected && (
        <form
          key={selected.id + action}
          onSubmit={submit}
          className="border bg-white p-6 rounded-xl space-y-4"
        >
          <h2 className="font-bold">{action} return</h2>
          <Field
            label="Decision / inspection note"
            name="note"
            required
            minLength={5}
          />
          {action === "inspect" &&
            selected.lines.map((l, i) => (
              <Field
                key={l.orderLineId}
                label={`Line ${i + 1}: sellable quantity to restock (received ${l.quantity})`}
                name={l.orderLineId}
                type="number"
                min="0"
                max={l.quantity}
                defaultValue="0"
                required
              />
            ))}
          <Action disabled={busy}>Confirm</Action>
        </form>
      )}
      {list.rows.map((r) => (
        <article
          key={r.id}
          className="bg-white border rounded-xl p-5 space-y-3"
        >
          <p className="font-semibold">
            {r.status} · {r.reason}
          </p>
          <p>{r.lines.reduce((sum, l) => sum + l.quantity, 0)} items</p>
          <a className="underline text-sm" href={`/orders?order=${r.orderId}`}>
            View order and refunds
          </a>
          <div className="flex gap-2">
            {(r.status === "requested"
              ? ["approve", "reject"]
              : r.status === "approved"
                ? ["receive"]
                : r.status === "received"
                  ? ["inspect"]
                  : r.status === "inspected"
                    ? ["close"]
                    : []
            ).map((a) => (
              <Action key={a} onClick={() => choose(r, a)}>
                {a}
              </Action>
            ))}
          </div>
        </article>
      ))}
      {!list.loading && !list.rows.length && <p>No return requests.</p>}
      <Pagination {...list} />
    </section>
  );
}
