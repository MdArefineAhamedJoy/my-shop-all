import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { PreviewSession, ResetChallenge, UserProfile } from "@/types/auth";
import {
  api,
  clearTokens,
  rememberTokens,
  restoreTokens,
  subscribeSignOut,
} from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
interface Context {
  session: PreviewSession | null;
  ready: boolean;
  error: string | null;
  challenge: ResetChallenge | null;
  setChallenge: (v: ResetChallenge | null) => void;
  signIn: (v: PreviewSession, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (user: UserProfile) => Promise<void>;
}
const SessionContext = createContext<Context | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const [session, setSession] = useState<PreviewSession | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState<string | null>(null),
    [challenge, setChallenge] = useState<ResetChallenge | null>(null);
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeSignOut(() => {
      client.clear();
      setSession(null);
      setChallenge(null);
    });
    restoreTokens()
      .then(async (restored) => {
        if (restored) {
          const user = await api<UserProfile>("me");
          if (active) setSession({ mode: "live", user });
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [client]);
  const signIn = useCallback(
    async (value: PreviewSession, remember: boolean) => {
      await rememberTokens(remember);
      client.clear();
      setSession(value);
      setChallenge(null);
      setError(null);
    },
    [client]
  );
  const signOut = useCallback(async () => {
    try {
      await api("auth/logout", { method: "POST" });
    } finally {
      await clearTokens();
      client.clear();
      setSession(null);
      setChallenge(null);
    }
  }, [client]);
  const updateProfile = useCallback(async (user: UserProfile) => {
    const updated = await api<UserProfile>("me", {
      method: "PATCH",
      body: JSON.stringify({
        name: user.name,
        phone: user.phone,
        expectedVersion: user.version,
      }),
    });
    setSession({ mode: "live", user: updated });
  }, []);
  return (
    <SessionContext.Provider
      value={{
        session,
        ready,
        error,
        challenge,
        setChallenge,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export function useSessionContext() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider is missing");
  return value;
}
