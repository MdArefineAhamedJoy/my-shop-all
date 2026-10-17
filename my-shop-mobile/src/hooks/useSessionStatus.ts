import { useSessionContext } from "@/providers/SessionProvider";

export function useSessionStatus() {
  const context = useSessionContext();
  return {
    ...context,
    user: context.session?.user ?? null,
    isLoggedIn: !!context.session,
    isChecking: !context.ready,
  };
}
