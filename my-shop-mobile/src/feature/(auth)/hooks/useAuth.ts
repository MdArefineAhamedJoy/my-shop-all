import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { authService } from "@/services/authService";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import type { LoginInput, RegisterInput } from "@/types/auth";
import { resolveAuthDestination } from "@/utils/navigation";

// Only explicitly approved in-app destinations may be restored after sign in.
export function useAuthDestination() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  return resolveAuthDestination(returnTo);
}
export function useLogin() {
  const { signIn } = useSessionStatus();
  return useMutation({
    mutationFn: async ({
      remember,
      ...input
    }: LoginInput & { remember: boolean }) => {
      const session = await authService.login(input);
      await signIn(session, remember);
    },
  });
}
export function useRegister() {
  const { signIn } = useSessionStatus();
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const session = await authService.register(input);
      await signIn(session, true);
    },
  });
}
export function useForgotPassword() {
  const { setChallenge } = useSessionStatus();
  return useMutation({
    mutationFn: authService.requestReset,
    onSuccess: (value) => {
      setChallenge(value);
      router.push("/otp-verification");
    },
  });
}
export function useVerifyCode() {
  const { challenge, setChallenge } = useSessionStatus();
  return useMutation({
    mutationFn: async (code: string) => {
      if (!challenge) throw new Error("Request a new code to continue.");
      return authService.verifyCode(challenge, code);
    },
    onSuccess: (value) => {
      setChallenge(value);
      router.replace("/create-newpassword");
    },
  });
}
export function useResetPassword() {
  const { challenge, setChallenge } = useSessionStatus();
  return useMutation({
    mutationFn: async (password: string) => {
      if (!challenge)
        throw new Error("Your reset session has ended. Start again.");
      await authService.resetPassword(challenge, password);
    },
    onSuccess: () => {
      setChallenge(null);
      router.replace("/reset-success");
    },
  });
}
