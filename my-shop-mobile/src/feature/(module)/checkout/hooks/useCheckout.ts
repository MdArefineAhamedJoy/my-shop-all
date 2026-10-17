import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { useShop } from "@/hooks/useShop";
import { addressSchema } from "@/schemas/addressSchema";
import { createPreviewOrder } from "@/services/orderService";
import type { Address } from "@/types/shop";

export function useCheckout() {
  const { user } = useSessionStatus();
  const { state, dispatch } = useShop();
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState("cod");
  const locked = useRef(false);
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
  const order = useMutation({
    mutationFn: async (address: Address) =>
      createPreviewOrder(state.cart, address, payment),
    onSuccess: (value) => {
      dispatch({ type: "order", order: value });
      router.replace({
        pathname: "/order/[id]",
        params: { id: value.id, placed: "1" },
      });
    },
    onError: () => {
      locked.current = false;
    },
  });
  const submit = () =>
    form.handleSubmit((address) => {
      if (step === 1) {
        setStep(2);
        return;
      }
      if (locked.current || !state.cart.length) return;
      locked.current = true;
      order.mutate(address);
    })();
  return { form, step, setStep, payment, setPayment, submit, order, state };
}
