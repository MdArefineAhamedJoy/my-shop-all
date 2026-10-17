import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { SectionHeading } from "@/components/layout/SectionHeading";
import {
  BottomSheet,
  Button,
  EmptyState,
  Icon,
  IconButton,
  Text,
} from "@/components/ui";
import { AppColors } from "@/constants";
import { useShop } from "@/hooks/useShop";
import type { SavedAddress } from "@/types/shop";
import { AddressForm } from "./components/AddressForm";

export default function AddressesScreen() {
  const { state, dispatch } = useShop();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const open = (address: SavedAddress | null) => {
    setEditing(address);
    setVisible(true);
  };
  return (
    <Screen>
      <View style={styles.content}>
        <SectionHeading
          title="Your address book."
          subtitle="One less detail to enter at checkout."
        />
        {state.addresses.length ? (
          state.addresses.map((address) => (
            <View key={address.id} style={styles.card}>
              <View style={styles.header}>
                <View style={styles.label}>
                  <Icon
                    name="location-outline"
                    size={18}
                    color={AppColors.primaryDark}
                  />
                  <Text style={styles.labelText}>{address.label}</Text>
                </View>
                <View style={styles.actions}>
                  <IconButton
                    name="create-outline"
                    label={`Edit ${address.label} address`}
                    onPress={() => open(address)}
                  />
                  <IconButton
                    name="trash-outline"
                    label={`Delete ${address.label} address`}
                    onPress={() =>
                      dispatch({ type: "delete-address", id: address.id })
                    }
                  />
                </View>
              </View>
              <Text style={styles.name}>
                {address.firstName} {address.lastName}
              </Text>
              <Text style={styles.address}>
                {address.address}
                {"\n"}
                {address.city} {address.postalCode}, Bangladesh{"\n"}
                {address.phone}
              </Text>
            </View>
          ))
        ) : (
          <EmptyState
            icon="location-outline"
            title="A place for your favorites."
            description="Save an address to make your next checkout a little easier."
          />
        )}
        <Button
          title="Add a new address"
          icon="add"
          variant="secondary"
          onPress={() => open(null)}
        />
      </View>
      <BottomSheet
        title={editing ? "Edit address" : "Add address"}
        visible={visible}
        onClose={() => setVisible(false)}
      >
        {visible && (
          <AddressForm
            key={editing?.id || "new"}
            address={editing}
            onSaved={() => setVisible(false)}
          />
        )}
      </BottomSheet>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: {
    maxWidth: 660,
    alignSelf: "center",
    width: "100%",
    paddingTop: 12,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 16,
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { flexDirection: "row", gap: 8, alignItems: "center" },
  labelText: { fontWeight: "600", fontSize: 13 },
  actions: { flexDirection: "row" },
  name: { fontWeight: "500", fontSize: 14, marginBottom: 8 },
  address: { color: AppColors.secondaryText, lineHeight: 23, fontSize: 13 },
});
