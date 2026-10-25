"use client";
import GatewayActions from "./GatewayActions";
import { FormEvent, useEffect, useRef, useState } from "react";
import { api, ApiProduct } from "@/lib/api";
import { useRows } from "./useRows";
import { Action, Field, Notice, Pagination, control } from "./Controls";
interface Order {
  paymentMethod: string;
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalMinor: number;
  collectedMinor: number;
  refundedMinor: number;
  version: number;
  shippingAddress: { name: string; phone: string; line1: string; city: string };
  lines?: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPriceMinor: number;
  }[];
}
export default function Orders({ invoices = false }: { invoices?: boolean }) {
  const list = useRows<Order>("admin/orders");
  const [selected, setSelected] = useState<Order | null>(null),
    [action, setAction] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [manual, setManual] = useState(false);
  const intent = useRef("");
  const manualIntent = useRef("");
  const manualQuote = useRef<{ id: string } | null>(null);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [customers, setCustomers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("order");
    if (id)
      api<Order>(`admin/orders/${id}`)
        .then(setSelected)
        .catch((e) => setError(e.message));
  }, []);
  function choose(name: string) {
    setAction(name);
    intent.current = crypto.randomUUID();
  }
  async function command(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const body: Record<string, unknown> = {
        expectedVersion: selected.version,
      };
      if (action === "ship") {
        body.courier = f.get("courier");
        body.trackingNumber = f.get("tracking");
      }
      if (action === "cancel") body.reason = f.get("reason");
      if (action === "cod-collections") {
        Object.assign(body, {
          amountMinor: Math.round(Number(f.get("amount")) * 100),
          reference: f.get("reference"),
          evidence: f.get("evidence"),
          collectedAt: new Date().toISOString(),
        });
      }
      if (action === "refunds") {
        Object.assign(body, {
          amountMinor: Math.round(Number(f.get("amount")) * 100),
          reference: f.get("reference"),
          reason: f.get("reason"),
          currentPassword: f.get("password"),
        });
      }
      await api(`admin/orders/${selected.id}/${action}`, {
        method: "POST",
        headers: { "Idempotency-Key": intent.current },
        body: JSON.stringify(body),
      });
      setSelected(await api(`admin/orders/${selected.id}`));
      setAction("");
      setError("");
      await list.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const quote =
        manualQuote.current ||
        (await api<{ id: string }>("admin/checkout/quotes", {
          method: "POST",
          body: JSON.stringify({
            customerId: f.get("customer"),
            items: [
              {
                variantId: f.get("variant"),
                quantity: Number(f.get("quantity")),
              },
            ],
            shippingAddress: {
              name: f.get("name"),
              phone: f.get("phone"),
              line1: f.get("line1"),
              city: f.get("city"),
              region: f.get("city"),
              postalCode: f.get("postal"),
              countryCode: "BD",
            },
            paymentMethod: "cod",
          }),
        }));
      manualQuote.current = quote;
      await api("admin/orders", {
        method: "POST",
        headers: { "Idempotency-Key": manualIntent.current },
        body: JSON.stringify({ quoteId: quote.id }),
      });
      setManual(false);
      setError("");
      await list.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Creation failed");
    } finally {
      setBusy(false);
    }
  }
  async function showManual() {
    manualIntent.current = crypto.randomUUID();
    manualQuote.current = null;
    try {
      const [p, c] = await Promise.all([
        api<ApiProduct[]>("admin/products?limit=100&status=published"),
        api<{ id: string; name: string; email: string }[]>(
          "admin/customers?limit=100",
        ),
      ]);
      setProducts(p);
      setCustomers(c);
      setManual(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load choices");
    }
  }
  return (
    <section className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-semibold">
          {invoices ? "Invoices" : "Orders"}
        </h1>
        {!invoices && <Action onClick={showManual}>Create order</Action>}
      </div>
      <Notice error={error || list.error} />
      {manual && (
        <form
          onSubmit={create}
          className="bg-white border p-6 rounded-xl grid sm:grid-cols-2 gap-4"
        >
          <label>
            Customer
            <select name="customer" required className={control}>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Product variant
            <select name="variant" required className={control}>
              {products.flatMap((p) =>
                p.variants
                  .filter((v) => v.active)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {p.name} · {v.size}/{v.color} · BDT {v.priceMinor / 100}
                    </option>
                  )),
              )}
            </select>
          </label>
          <Field
            label="Quantity"
            name="quantity"
            type="number"
            min="1"
            max="99"
            defaultValue="1"
            required
          />
          {[
            ["name", "Delivery name"],
            ["phone", "Phone"],
            ["line1", "Street address"],
            ["city", "City"],
            ["postal", "Postal code"],
          ].map(([name, label]) => (
            <Field key={name} name={name} label={label} required />
          ))}
          <Action disabled={busy}>Create COD order</Action>
          <Action onClick={() => setManual(false)}>Close</Action>
        </form>
      )}
      {selected && (
        <section className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-xl">{selected.orderNumber}</h2>
          <p>
            {selected.shippingAddress.name} · {selected.shippingAddress.phone}
          </p>
          <p>
            {selected.shippingAddress.line1}, {selected.shippingAddress.city}
          </p>
          <p>
            Status: {selected.status} · Payment: {selected.paymentStatus}
          </p>
          {selected.lines?.map((l) => (
            <p key={l.id}>
              {l.name} ({l.sku}) × {l.quantity} · BDT{" "}
              {((l.unitPriceMinor * l.quantity) / 100).toFixed(2)}
            </p>
          ))}
          <p>
            Total BDT {(selected.totalMinor / 100).toFixed(2)} · Collected BDT{" "}
            {(selected.collectedMinor / 100).toFixed(2)} · Refunded BDT{" "}
            {(selected.refundedMinor / 100).toFixed(2)}
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.status === "pending" && (
              <Action onClick={() => choose("process")}>Process</Action>
            )}
            {selected.status === "processing" && (
              <Action onClick={() => choose("ship")}>Ship</Action>
            )}
            {selected.status === "shipped" && (
              <Action onClick={() => choose("deliver")}>Mark delivered</Action>
            )}
            {["pending", "processing"].includes(selected.status) && (
              <Action onClick={() => choose("cancel")}>Cancel</Action>
            )}
            {selected.paymentMethod === "cod" &&
              selected.status === "delivered" &&
              selected.collectedMinor < selected.totalMinor && (
                <Action onClick={() => choose("cod-collections")}>
                  Record COD collection
                </Action>
              )}
            {selected.paymentMethod === "cod" &&
              selected.collectedMinor > selected.refundedMinor && (
                <Action onClick={() => choose("refunds")}>
                  Record external COD refund
                </Action>
              )}
            <Action
              onClick={() => {
                setSelected(null);
                setAction("");
              }}
            >
              Close details
            </Action>
          </div>
          <GatewayActions
            order={selected}
            onUpdate={async () => {
              setSelected(await api(`admin/orders/${selected.id}`));
              await list.refresh();
            }}
          />
          {action && (
            <form
              key={action}
              onSubmit={command}
              className="border-t pt-5 grid sm:grid-cols-2 gap-4"
            >
              <h3 className="col-span-full font-semibold">
                Confirm {action.replaceAll("-", " ")}
              </h3>
              {action === "ship" && (
                <>
                  <Field label="Courier" name="courier" required />
                  <Field label="Tracking number" name="tracking" required />
                </>
              )}
              {["cancel", "refunds"].includes(action) && (
                <Field label="Reason" name="reason" required minLength={5} />
              )}{" "}
              {["refunds", "cod-collections"].includes(action) && (
                <>
                  <Field
                    label="Amount (BDT)"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                  />
                  <Field
                    label="Unique payment/reference number"
                    name="reference"
                    required
                    minLength={5}
                  />
                </>
              )}
              {action === "cod-collections" && (
                <Field
                  label="Courier settlement evidence"
                  name="evidence"
                  required
                  minLength={5}
                />
              )}{" "}
              {action === "refunds" && (
                <Field
                  label="Your current password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              )}
              <Action disabled={busy}>Confirm action</Action>
            </form>
          )}
        </section>
      )}
      {list.rows.map((o) => (
        <article
          key={o.id}
          className="bg-white border p-5 rounded-xl flex flex-wrap justify-between gap-4"
        >
          <div>
            <strong>{o.orderNumber}</strong>
            <p className="text-sm text-slate-500">
              {o.status} · {o.paymentStatus} · BDT{" "}
              {(o.totalMinor / 100).toFixed(2)}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {!invoices && (
              <Action
                onClick={async () => {
                  try {
                    setSelected(await api(`admin/orders/${o.id}`));
                    setAction("");
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Could not load order",
                    );
                  }
                }}
              >
                Details
              </Action>
            )}
            {o.status !== "cancelled" && (
              <a
                className="underline text-sm"
                href={`/api/v1/admin/orders/${o.id}/invoice`}
              >
                Download PDF
              </a>
            )}
          </div>
        </article>
      ))}
      {!list.rows.length && !list.loading && <p>No orders yet.</p>}
      <Pagination {...list} />
    </section>
  );
}
