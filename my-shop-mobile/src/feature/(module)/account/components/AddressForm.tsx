import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { AddressFields } from "@/components/forms/AddressFields";
import { Button, Input } from "@/components/ui";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { useShop } from "@/hooks/useShop";
import { addressSchema } from "@/schemas/addressSchema";
import type { Address, SavedAddress } from "@/types/shop";
import { createLocalId } from "@/utils/ids";

export function AddressForm({
  address,
  onSaved,
}: {
  address: SavedAddress | null;
  onSaved: () => void;
}) {
  const { user } = useSessionStatus();
  const { dispatch } = useShop();
  const [label, setLabel] = useState(address?.label || "Home");
  const { control, handleSubmit } = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: address || {
      firstName: user?.name.split(" ")[0] || "",
      lastName: user?.name.split(" ").slice(1).join(" ") || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      postalCode: "",
    },
  });
  const save = (values: Address) => {
    dispatch({
      type: "save-address",
      address: {
        ...values,
        id: address?.id || createLocalId("address"),
        label: label.trim() || "Home",
      },
    });
    onSaved();
  };
  return (
    <>
      <Input
        label="Address label"
        value={label}
        onChangeText={setLabel}
        placeholder="Home, office…"
        maxLength={30}
      />
      <AddressFields control={control} />
      <Button title="Save address" onPress={handleSubmit(save)} />
    </>
  );
}
