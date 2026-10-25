"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { PaymentActions } from "@/components/checkout/PaymentActions";
import { useStore } from "@/lib/store";
interface Order {
  paymentMethod: string;
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalMinor: number;
  version: number;
  lines?: { id: string; name: string; quantity: number }[];
}
export default function AccountPage() {
  const { user, refresh } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    () =>
      api<Order[]>("me/orders?limit=100")
        .then(setOrders)
        .catch((e) => {
          if (e instanceof ApiError && e.status === 401)
            window.location.assign("/login?next=/account");
          else
            setError(e instanceof Error ? e.message : "Could not load orders");
        }),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function logout() {
    setBusy(true);
    try {
      await api("auth/logout", { method: "POST" });
      await refresh();
      window.location.assign("/");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401)
        window.location.assign("/");
      else setError(e instanceof Error ? e.message : "Sign out failed");
    } finally {
      setBusy(false);
    }
  }
  async function profile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api("me", {
        method: "PATCH",
        body: JSON.stringify({
          name: f.get("name"),
          phone: f.get("phone"),
          expectedVersion: user?.version,
        }),
      });
      await refresh();
      setNotice("Profile saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }
  async function action(order: Order, type: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const reason = prompt(
        type === "cancel"
          ? "Why are you cancelling?"
          : "Why are you returning these items?",
      );
      if (!reason) return;
      await api(
        `orders/${order.id}/${type === "cancel" ? "cancel" : "returns"}`,
        {
          method: "POST",
          headers: { "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify(
            type === "cancel"
              ? { expectedVersion: order.version, reason }
              : {
                  lines: order.lines?.map((l) => ({
                    orderLineId: l.id,
                    quantity: l.quantity,
                  })),
                  reason,
                },
          ),
        },
      );
      setNotice(type === "cancel" ? "Order cancelled" : "Return requested");
      setSelected(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="max-w-5xl mx-auto px-5 py-32 space-y-8">
      <div className="flex justify-between">
        <h1 className="text-3xl font-serif">Your account</h1>
        <button
          disabled={!user || busy}
          onClick={() => void logout()}
          className="underline"
        >
          Sign out
        </button>
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {user && (
        <form onSubmit={profile} className="grid gap-3 max-w-md">
          <h2 className="font-bold">Profile</h2>
          <p>{user.email}</p>
          <input
            name="name"
            defaultValue={user.name}
            required
            minLength={2}
            className="border p-3 rounded"
          />
          <input
            name="phone"
            placeholder="Phone"
            required
            className="border p-3 rounded"
          />
          <button className="bg-black text-white p-3 rounded">
            Save profile
          </button>
        </form>
      )}
      <section className="space-y-4">
        <h2 className="text-2xl font-serif">Orders</h2>
        {!orders.length && (
          <p>
            No orders yet. <Link href="/shop">Browse the collection</Link>
          </p>
        )}
        {orders.map((o) => (
          <article key={o.id} className="border rounded-lg p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <strong>{o.orderNumber}</strong>
              <span>BDT {(o.totalMinor / 100).toFixed(2)}</span>
            </div>
            <p>
              {o.status} · {o.paymentStatus}
            </p>
            <PaymentActions order={o} onUpdate={load} />
            <button
              className="underline mt-3"
              onClick={async () =>
                setSelected(await api<Order>(`orders/${o.id}`))
              }
            >
              View details
            </button>{" "}
            ·{" "}
            <a href={`/api/v1/orders/${o.id}/invoice`} className="underline">
              Download invoice
            </a>
          </article>
        ))}
      </section>
      {selected && (
        <section className="bg-stone-50 border p-6 rounded-lg space-y-4">
          <h2 className="font-bold">{selected.orderNumber}</h2>
          {selected.lines?.map((l) => (
            <p key={l.id}>
              {l.name} × {l.quantity}
            </p>
          ))}
          {["pending", "processing"].includes(selected.status) && (
            <button
              disabled={busy}
              onClick={() => action(selected, "cancel")}
              className="border p-3 rounded"
            >
              Cancel order
            </button>
          )}
          {selected.status === "delivered" && (
            <button
              disabled={busy}
              onClick={() => action(selected, "return")}
              className="border p-3 rounded"
            >
              Request return of these items
            </button>
          )}
          <button className="ml-3 underline" onClick={() => setSelected(null)}>
            Close
          </button>
        </section>
      )}
    </main>
  );
}
