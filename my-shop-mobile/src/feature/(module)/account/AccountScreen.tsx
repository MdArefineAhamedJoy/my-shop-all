import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { BottomSheet, Button, Icon, Notice, Text } from "@/components/ui";
import { AppColors } from "@/constants";
import { appConfig } from "@/config/app";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { useShop } from "@/hooks/useShop";
import { AccountMenuItem } from "./components/AccountMenuItem";

export default function AccountScreen() {
  const { user, signOut } = useSessionStatus();
  const { state } = useShop();
  const [confirm, setConfirm] = useState(false);
  const logout = useMutation({
    mutationFn: signOut,
    onSuccess: () => setConfirm(false),
  });
  const orders = state.orders;
  return (
    <Screen safeBottom={false}>
      <View style={styles.container}>
        <SectionHeading title="Your little style space." />
        <View style={styles.profile}>
          <View style={styles.avatar}>
            {user ? (
              <Text style={styles.initial}>{user.name[0].toUpperCase()}</Text>
            ) : (
              <Icon
                name="person-outline"
                size={32}
                color={AppColors.primaryDark}
              />
            )}
          </View>
          <Text style={styles.name}>
            {user
              ? `Hello, ${user.name.split(" ")[0]}`
              : "Make yourself at home."}
          </Text>
          <Text style={styles.email}>
            {user?.email ||
              "Your favorites, your orders, your own kind of style."}
          </Text>
          {user ? (
            <View style={styles.preview}>
              <Text style={styles.previewText}>Customer account</Text>
            </View>
          ) : (
            <View style={styles.authActions}>
              <Button title="Sign in" onPress={() => router.push("/login")} />
              <Button
                title="Create an account"
                variant="secondary"
                onPress={() => router.push("/create-account")}
              />
            </View>
          )}
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{state.wishlist.length}</Text>
            <Text style={styles.statLabel}>Saved pieces</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{state.addresses.length}</Text>
            <Text style={styles.statLabel}>Addresses</Text>
          </View>
        </View>
        <AccountMenuItem
          title="Personal information"
          subtitle="The details that make this space yours"
          icon="person-outline"
          onPress={() => router.push("/profile")}
        />
        <AccountMenuItem
          title="My orders"
          subtitle="Revisit your recent favorites"
          icon="cube-outline"
          onPress={() => router.push("/orders")}
        />
        <AccountMenuItem
          title="Address book"
          subtitle="Keep your delivery details close"
          icon="location-outline"
          onPress={() => router.push("/addresses")}
        />
        <AccountMenuItem
          title="My wishlist"
          subtitle="A little inspiration for later"
          icon="heart-outline"
          onPress={() => router.navigate("/wishlist")}
        />
        {user && (
          <View style={styles.signOut}>
            <Button
              title="Sign out"
              variant="ghost"
              onPress={() => setConfirm(true)}
            />
          </View>
        )}
        <Text style={styles.footnote}>
          {appConfig.name} · Frontend {appConfig.mode} · v{appConfig.version}
        </Text>
      </View>
      <BottomSheet
        title="Sign out?"
        visible={confirm}
        onClose={() => setConfirm(false)}
        footer={
          <>
            <Button
              title="Sign out"
              loading={logout.isPending}
              onPress={() => logout.mutate()}
            />
            <Button
              title="Stay here"
              variant="secondary"
              onPress={() => setConfirm(false)}
            />
          </>
        }
      >
        <Text style={styles.confirmText}>
          Your shopping bag and favorites are saved with your account. Sign in
          again to access them.
        </Text>
        {logout.error && <Notice tone="error">{logout.error.message}</Notice>}
      </BottomSheet>
    </Screen>
  );
}
const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 660,
    alignSelf: "center",
    paddingTop: 8,
  },
  profile: { alignItems: "center", paddingVertical: 22 },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 27,
    backgroundColor: AppColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  initial: { fontSize: 32, color: AppColors.primaryDark, fontWeight: "600" },
  name: {
    fontSize: 23,
    fontWeight: "600",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  email: {
    fontSize: 12,
    color: AppColors.secondaryText,
    marginTop: 10,
    lineHeight: 21,
    textAlign: "center",
  },
  preview: {
    marginTop: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: AppColors.background,
  },
  previewText: { color: AppColors.secondaryText, fontSize: 10 },
  authActions: { width: "100%", gap: 12, marginTop: 24 },
  stats: {
    paddingVertical: 22,
    marginVertical: 12,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    flexDirection: "row",
    alignItems: "center",
  },
  stat: { flex: 1, alignItems: "center", gap: 7 },
  statValue: { fontSize: 23, fontWeight: "600" },
  statLabel: { fontSize: 10, color: AppColors.secondaryText },
  divider: { height: 30, width: 1, backgroundColor: AppColors.border },
  signOut: { marginTop: 22 },
  footnote: {
    marginTop: 32,
    fontSize: 10,
    color: AppColors.secondaryText,
    textAlign: "center",
  },
  confirmText: {
    color: AppColors.secondaryText,
    fontSize: 14,
    lineHeight: 24,
    paddingBottom: 18,
  },
});
