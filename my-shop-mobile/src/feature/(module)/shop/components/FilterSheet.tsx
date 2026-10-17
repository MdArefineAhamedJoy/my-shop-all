import { StyleSheet, View } from "react-native";
import {
  BottomSheet,
  Button,
  Chip,
  Input,
  Notice,
  Text,
} from "@/components/ui";
import { sortOptions } from "@/data/storefront";
import type { useShopFilters } from "../hooks/useShopFilters";

export function FilterSheet({
  state,
}: {
  state: ReturnType<typeof useShopFilters>;
}) {
  const { draft, setDraft } = state;
  return (
    <BottomSheet
      title="Filter & sort"
      visible={state.visible}
      onClose={() => state.setVisible(false)}
      footer={
        <>
          <Button title="Show results" onPress={state.apply} />
          <Button
            title="Clear filters"
            variant="ghost"
            onPress={() => {
              setDraft({});
              state.setError("");
            }}
          />
        </>
      }
    >
      <Text style={styles.label}>SIZE</Text>
      <View style={styles.sizes}>
        {[
          "",
          "S",
          "M",
          "L",
          "XL",
          "XXL",
          "30",
          "32",
          "34",
          "36",
          "38",
          "40",
        ].map((size) => (
          <Chip
            key={size}
            title={size || "Any size"}
            selected={(draft.size || "") === size}
            onPress={() => setDraft({ ...draft, size })}
          />
        ))}
      </View>
      <Text style={styles.label}>PRICE RANGE</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            label="Minimum price (৳)"
            placeholder="0"
            keyboardType="numeric"
            value={draft.min || ""}
            onChangeText={(min) => setDraft({ ...draft, min })}
          />
        </View>
        <View style={styles.half}>
          <Input
            label="Maximum price (৳)"
            placeholder="Any"
            keyboardType="numeric"
            value={draft.max || ""}
            onChangeText={(max) => setDraft({ ...draft, max })}
          />
        </View>
      </View>
      <Text style={styles.label}>SORT BY</Text>
      <View style={styles.sorts}>
        {sortOptions.map((sort) => (
          <Chip
            key={sort.title}
            title={sort.title}
            selected={(draft.sort || "") === sort.value}
            onPress={() => setDraft({ ...draft, sort: sort.value })}
          />
        ))}
      </View>
      {!!state.error && <Notice tone="error">{state.error}</Notice>}
    </BottomSheet>
  );
}
const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "600",
    marginBottom: 14,
  },
  sizes: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  sorts: { gap: 9, marginBottom: 16 },
});
