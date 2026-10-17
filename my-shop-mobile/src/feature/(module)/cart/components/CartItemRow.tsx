import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { QuantitySelector } from "@/components/commerce/QuantitySelector";
import { IconButton, ProductImage, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { useShop } from "@/hooks/useShop";
import type { CartItem } from "@/types/shop";
import { cartKey, money } from "@/utils/commerce";

export function CartItemRow({ item }: { item: CartItem }) {
  const { state, dispatch } = useShop();
  const key = cartKey(item);
  const otherQuantity = state.cart
    .filter(
      (entry) => entry.product.id === item.product.id && cartKey(entry) !== key
    )
    .reduce((sum, entry) => sum + entry.quantity, 0);
  return (
    <View style={styles.row}>
      <ProductImage path={item.product.images[0]} style={styles.image} />
      <View style={styles.content}>
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            router.push({
              pathname: "/product/[slug]",
              params: { slug: item.product.slug },
            })
          }
        >
          <Text style={styles.name}>{item.product.name}</Text>
        </Pressable>
        <Text style={styles.variant}>
          Size {item.size} · {item.color || "Standard"}
        </Text>
        <Text style={styles.price}>
          {money(item.product.price * item.quantity)}
        </Text>
        <View style={styles.actions}>
          <QuantitySelector
            value={item.quantity}
            max={item.product.stock - otherQuantity}
            onChange={(quantity) =>
              dispatch({ type: "quantity", key, quantity })
            }
          />
          <IconButton
            name="trash-outline"
            label={`Remove ${item.product.name} from bag`}
            onPress={() => dispatch({ type: "remove", key })}
          />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 16,
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  image: { width: 96, height: 126, borderRadius: 12 },
  content: { flex: 1, gap: 8 },
  name: { fontWeight: "600", fontSize: 13, lineHeight: 20 },
  variant: { color: AppColors.secondaryText, fontSize: 11 },
  price: { fontWeight: "600", fontSize: 14 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
});
