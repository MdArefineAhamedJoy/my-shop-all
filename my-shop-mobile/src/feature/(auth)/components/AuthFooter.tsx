import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppColors } from "@/constants";
import { Text } from "@/components/ui";

export function AuthFooter({
  text,
  action,
  href,
}: {
  text: string;
  action: string;
  href: Href;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{text}</Text>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.replace(href)}
        style={styles.link}
      >
        <Text style={styles.action}>{action}</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 22,
  },
  text: { fontSize: 13, color: AppColors.secondaryText },
  link: { minHeight: 44, justifyContent: "center" },
  action: { color: AppColors.primaryDark, fontSize: 13, fontWeight: "600" },
});
