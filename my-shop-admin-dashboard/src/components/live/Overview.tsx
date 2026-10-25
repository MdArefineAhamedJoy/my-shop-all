"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Notice } from "./Controls";
interface Overview {
  ordersPlaced: number;
  cancelledOrders: number;
  deliveredOrders: number;
  orderedMinor: string;
  collectedMinor: string;
  refundedMinor: string;
  daily: { day: string; orders: number; orderedMinor: string }[];
  refreshedAt: string;
}
export default function OverviewPage() {
  const [value, setValue] = useState<Overview | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api<Overview>("admin/reports/overview")
      .then(setValue)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Shop overview</h1>
      <p className="text-slate-500">Last 30 days · BDT · Asia/Dhaka</p>
      <Notice error={error} />
      {value && (
        <>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              ["Orders placed", value.ordersPlaced],
              ["Delivered orders", value.deliveredOrders],
              ["Cancelled orders", value.cancelledOrders],
              [
                "Order value (BDT)",
                (Number(value.orderedMinor) / 100).toFixed(2),
              ],
              [
                "Collected (BDT)",
                (Number(value.collectedMinor) / 100).toFixed(2),
              ],
              [
                "Refunded (BDT)",
                (Number(value.refundedMinor) / 100).toFixed(2),
              ],
            ].map(([label, n]) => (
              <article key={label} className="bg-white border rounded-xl p-6">
                <h2 className="text-slate-500 text-sm">{label}</h2>
                <strong className="text-3xl block mt-3">{n}</strong>
              </article>
            ))}
          </div>
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Daily orders</h2>
            {value.daily.map((d) => (
              <div key={d.day} className="flex justify-between border-b py-3">
                <span>{d.day}</span>
                <span>
                  {d.orders} orders · BDT{" "}
                  {(Number(d.orderedMinor) / 100).toFixed(2)}
                </span>
              </div>
            ))}
            {!value.daily.length && <p>No orders in this period.</p>}
          </div>
          <p className="text-xs text-slate-500">
            Order value includes non-cancelled orders placed in the period.
            Collected and refunded amounts follow their own event dates. Updated{" "}
            {new Date(value.refreshedAt).toLocaleString()}.
          </p>
        </>
      )}
    </section>
  );
}
