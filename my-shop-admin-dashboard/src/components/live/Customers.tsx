"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRows } from "./useRows";
import { Action, Notice, Pagination } from "./Controls";
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
}
export default function Customers() {
  const list = useRows<Customer>("admin/customers");
  const [orders, setOrders] = useState<
      | {
          id: string;
          orderNumber: string;
          status: string;
          totalMinor: number;
        }[]
      | null
    >(null),
    [error, setError] = useState("");
  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-semibold">Customers</h1>
      <Notice error={error || list.error} />
      {orders && (
        <section className="border bg-white p-5 rounded-xl space-y-3">
          <h2 className="font-semibold">Customer orders</h2>
          {orders.map((o) => (
            <a
              key={o.id}
              href={`/orders?order=${o.id}`}
              className="block underline"
            >
              {o.orderNumber} · {o.status} · BDT{" "}
              {(o.totalMinor / 100).toFixed(2)}
            </a>
          ))}
          {!orders.length && <p>No orders yet.</p>}
          <Action onClick={() => setOrders(null)}>Close</Action>
        </section>
      )}
      {list.rows.map((c) => (
        <article
          key={c.id}
          className="bg-white border rounded-xl p-5 flex justify-between gap-4"
        >
          <div>
            <strong>{c.name}</strong>
            <p>
              {c.email} · {c.phone || "No phone"}
            </p>
            <p>{c.active ? "Active" : "Disabled"}</p>
          </div>
          <Action
            onClick={async () => {
              try {
                setOrders(
                  await api(`admin/customers/${c.id}/orders?limit=100`),
                );
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Could not load orders",
                );
              }
            }}
          >
            View orders
          </Action>
        </article>
      ))}
      <Pagination {...list} />
    </section>
  );
}
