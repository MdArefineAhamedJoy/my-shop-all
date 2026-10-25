"use client";
import { useEffect, useRef, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
interface Quote {
  id: string;
  totals: {
    subtotalMinor: number;
    discountMinor: number;
    shippingMinor: number;
    taxMinor: number;
    totalMinor: number;
  };
}
const money = (n: number) =>
  `BDT ${(n / 100).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;
export default function LiveCheckout() {
  const { cart, user, refresh } = useStore();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [methods, setMethods] = useState<string[]>(["cod"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [payment, setPayment] = useState("cod");
  const intent = useRef("");
  useEffect(() => {
    api<{ paymentMethods: string[] }>("checkout/options")
      .then((v) => setMethods(v.paymentMethods))
      .catch((e) => setError(e.message));
  }, []);
  async function review(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) {
      router.push("/login?next=/checkout");
      return;
    }
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const q = await api<Quote>("checkout/quotes", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: {
            name: f.get("name"),
            phone: f.get("phone"),
            line1: f.get("line1"),
            city: f.get("city"),
            region: f.get("region"),
            postalCode: f.get("postalCode"),
            countryCode: "BD",
          },
          paymentMethod: payment,
          ...(f.get("promotion") ? { promotionCode: f.get("promotion") } : {}),
        }),
      });
      intent.current = crypto.randomUUID();
      setQuote(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }
  async function place() {
    if (!quote || busy) return;
    setBusy(true);
    setError("");
    try {
      const order = orderId
        ? { id: orderId }
        : await api<{ id: string }>("orders", {
            method: "POST",
            headers: { "Idempotency-Key": intent.current },
            body: JSON.stringify({ quoteId: quote.id }),
          });
      setOrderId(order.id);
      await refresh();
      if (payment === "cod") router.replace(`/account?order=${order.id}`);
      else {
        const session = await api<{ checkoutUrl: string }>(
          `orders/${order.id}/payment-session`,
          {
            method: "POST",
            headers: { "Idempotency-Key": `payment-${intent.current}` },
          },
        );
        window.location.assign(session.checkoutUrl);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Placement failed; retry with the same checkout",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-32">
      <div className="max-w-5xl mx-auto">
        <Link href="/cart" className="text-sm underline">
          Back to your bag
        </Link>
        <h1 className="text-4xl font-serif my-8">Secure checkout</h1>
        {error && (
          <p role="alert" className="p-4 bg-red-50 text-red-800 mb-6">
            {error}
          </p>
        )}
        {!cart.length && !orderId && !quote ? (
          <p>
            Your bag is empty. <Link href="/shop">Browse the collection</Link>
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-12">
            <section>
              {!quote ? (
                <form onSubmit={review} className="space-y-4">
                  <h2 className="text-xl font-bold">Delivery details</h2>
                  {[
                    ["name", "Full name", user?.name],
                    ["phone", "Phone", ""],
                    ["line1", "Street address", ""],
                    ["city", "City", "Dhaka"],
                    ["region", "Region", "Dhaka"],
                    ["postalCode", "Postal code", ""],
                  ].map(([name, label, value]) => (
                    <label key={name} className="block text-sm">
                      {label}
                      <input
                        required
                        name={name}
                        defaultValue={value}
                        minLength={name === "line1" ? 5 : 2}
                        className="mt-1 block w-full border rounded-lg p-3"
                      />
                    </label>
                  ))}
                  <label className="block text-sm">
                    Payment method
                    <select
                      value={payment}
                      onChange={(e) => setPayment(e.target.value)}
                      className="mt-1 block w-full border p-3 rounded-lg"
                    >
                      {methods.map((m) => (
                        <option value={m} key={m}>
                          {m === "cod"
                            ? "Cash on delivery"
                            : "Card / bKash / Nagad — secure gateway"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    Promotion code (optional)
                    <input
                      name="promotion"
                      className="mt-1 w-full border p-3 rounded-lg"
                    />
                  </label>
                  <button
                    disabled={busy}
                    className="bg-black text-white rounded-lg p-4 w-full"
                  >
                    {busy ? "Calculating…" : "Review order"}
                  </button>
                </form>
              ) : (
                <div className="bg-white p-6 rounded-xl space-y-4">
                  <h2 className="text-2xl font-serif">Review your order</h2>
                  {Object.entries(quote.totals).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>
                        {key.replace("Minor", "").replace(/([A-Z])/g, " $1")}
                      </span>
                      <strong>{money(value)}</strong>
                    </div>
                  ))}
                  <p className="text-sm text-stone-500">
                    Prices, stock, shipping and tax have been checked by the
                    shop. Quotes expire after five minutes.
                  </p>
                  <button
                    onClick={place}
                    disabled={busy}
                    className="bg-black text-white rounded-lg p-4 w-full"
                  >
                    {busy
                      ? "Placing order…"
                      : orderId
                        ? "Continue to payment"
                        : "Confirm order"}
                  </button>
                  {!orderId && (
                    <button
                      onClick={() => setQuote(null)}
                      className="underline"
                    >
                      Change delivery details
                    </button>
                  )}
                </div>
              )}
            </section>
            <aside className="space-y-4">
              {cart.map((item) => (
                <div key={item.variantId} className="bg-white p-5 rounded-lg">
                  <strong>{item.product.name}</strong>
                  <p>
                    {item.selectedSize} / {item.selectedColor} · Qty{" "}
                    {item.quantity}
                  </p>
                  <p>BDT {(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
