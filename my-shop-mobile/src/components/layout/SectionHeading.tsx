import { Pressable, StyleSheet, View } from "react-native";
import { AppColors } from "@/constants";
import { Text } from "@/components/ui";
interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}
export function SectionHeading({
  title,
  subtitle,
  action,
  onAction,
}: SectionHeadingProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action}: ${title}`}
          onPress={onAction}
          style={styles.action}
        >
          <Text style={styles.link}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  copy: { flex: 1 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.8 },
  subtitle: {
    color: AppColors.secondaryText,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 6,
  },
  action: { minHeight: 44, justifyContent: "center" },
  link: { color: AppColors.primaryDark, fontSize: 12, fontWeight: "600" },
});
