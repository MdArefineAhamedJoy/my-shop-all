import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/ui";
import { AuthFormScreen } from "../../components/AuthFormScreen";
import { AuthFooter } from "../../components/AuthFooter";
import { useAuthDestination } from "../../hooks/useAuth";
import { LoginForm } from "./LoginForm";

export default function Login() {
  const returnTo = useAuthDestination();
  return (
    <AuthFormScreen
      title="Welcome back."
      subtitle="Sign in to keep your favorites, orders and everyday style in one place."
    >
      <LoginForm />
      <AuthFooter
        text="New to MYSHOP?"
        action="Create an account"
        href={{ pathname: "/create-account", params: { returnTo } }}
      />
      <View style={styles.guest}>
        <Button
          title="Continue as guest"
          variant="ghost"
          onPress={() => router.replace("/")}
        />
      </View>
    </AuthFormScreen>
  );
}
const styles = StyleSheet.create({ guest: { marginTop: 6 } });
