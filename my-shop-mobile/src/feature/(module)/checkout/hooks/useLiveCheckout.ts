import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { useShop } from "@/hooks/useShop";
import { addressSchema } from "@/schemas/addressSchema";
import {
  placeOrder,
  quoteOrder,
  CheckoutQuote,
} from "@/services/liveOrderService";
import { api } from "@/services/api";
import type { Address } from "@/types/shop";
import { createLocalId } from "@/utils/ids";
import * as Linking from "expo-linking";
export function useCheckout() {
  const { user } = useSessionStatus();
  const { state, dispatch } = useShop();
  const [step, setStep] = useState(1),
    [payment, setPaymentState] = useState("cod"),
    [quote, setQuote] = useState<CheckoutQuote | null>(null),
    [methods, setMethods] = useState<string[]>(["cod"]);
  const intent = useRef("");
  const placed = useRef<string | null>(null);
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const form = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: user?.name.split(" ")[0] || "",
      lastName: user?.name.split(" ").slice(1).join(" ") || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      postalCode: "",
    },
  });
  useEffect(() => {
    api<{ paymentMethods: string[] }>("checkout/options")
      .then((v) => setMethods(v.paymentMethods))
      .catch(() => setMethods(["cod"]));
  }, []);
  const order = useMutation({
    mutationFn: async (address: Address) => {
      if (step === 1 || !quote) {
        const result = await quoteOrder(address, payment);
        setQuote(result);
        intent.current = createLocalId("checkout");
        setStep(2);
        return null;
      }
      const result = placed.current
        ? { id: placed.current }
        : await placeOrder(quote.id, intent.current, user?.email || "");
      placed.current = result.id;
      setHasPlacedOrder(true);
      if (payment !== "cod") {
        const session = await api<{ checkoutUrl: string }>(
          `orders/${result.id}/payment-session`,
          {
            method: "POST",
            headers: { "Idempotency-Key": `payment-${intent.current}` },
          }
        );
        await Linking.openURL(session.checkoutUrl);
      }
      await dispatch({
        type: "order",
        order: result as import("@/types/shop").Order,
      });
      return result;
    },
    onSuccess: (value) => {
      if (value)
        router.replace({
          pathname: "/order/[id]",
          params: { id: value.id, placed: "1" },
        });
    },
  });
  return {
    hasPlacedOrder,
    form,
    step,
    setStep,
    payment,
    setPayment: (value: string) => {
      setPaymentState(value);
      setQuote(null);
      setStep(1);
    },
    methods,
    quote,
    submit: () =>
      form.handleSubmit((address) => {
        if (!order.isPending && (state.cart.length || placed.current))
          order.mutate(address);
      })(),
    order,
    state,
  };
}
