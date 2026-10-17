import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text, type IconName } from "@/components/ui";
import { AppColors } from "@/constants";

interface AccountMenuItemProps {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
}
export function AccountMenuItem({
  title,
  subtitle,
  icon,
  onPress,
}: AccountMenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
    >
      <View style={styles.icon}>
        <Icon name={icon} size={21} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Icon name="chevron-forward" size={17} color={AppColors.secondaryText} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: AppColors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  copy: { flex: 1 },
  title: { fontSize: 14, fontWeight: "500" },
  subtitle: {
    fontSize: 11,
    color: AppColors.secondaryText,
    marginTop: 5,
    lineHeight: 18,
  },
});
