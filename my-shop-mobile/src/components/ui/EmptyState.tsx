import { StyleSheet, View } from "react-native";
import { AppColors } from "@/constants";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: IconName;
  action?: string;
  onAction?: () => void;
}
export function EmptyState({
  title,
  description,
  icon = "bag-handle-outline",
  action,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Icon name={icon} size={34} color={AppColors.primaryDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action && onAction && <Button title={action} onPress={onAction} />}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
  circle: {
    padding: 24,
    borderRadius: 50,
    backgroundColor: AppColors.primaryLight,
  },
  title: { fontSize: 23, fontWeight: "700", textAlign: "center" },
  description: {
    fontSize: 14,
    lineHeight: 23,
    textAlign: "center",
    color: AppColors.secondaryText,
    marginBottom: 8,
  },
});
