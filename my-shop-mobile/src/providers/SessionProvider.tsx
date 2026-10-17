import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { STORAGE_KEYS } from "@/constants/storage";
import { storage } from "@/lib/storage";
import type { PreviewSession, ResetChallenge, UserProfile } from "@/types/auth";

interface SessionContextValue {
  session: PreviewSession | null;
  ready: boolean;
  error: string | null;
  challenge: ResetChallenge | null;
  setChallenge: (value: ResetChallenge | null) => void;
  signIn: (value: PreviewSession, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (value: UserProfile) => Promise<void>;
}
const SessionContext = createContext<SessionContextValue | null>(null);
function isSession(value: unknown): value is PreviewSession {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<PreviewSession>;
  return (
    s.mode === "preview" &&
    typeof s.user?.id === "string" &&
    typeof s.user.email === "string" &&
    typeof s.user.name === "string"
  );
}
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<PreviewSession | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<ResetChallenge | null>(null);
  const persistent = useRef(false);
  useEffect(() => {
    let active = true;
    storage
      .read(STORAGE_KEYS.session, isSession)
      .then((value) => {
        if (active) {
          persistent.current = !!value;
          setSession(value);
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Your previous preview session could not be restored. Please sign in again."
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const signIn = useCallback(
    async (value: PreviewSession, remember: boolean) => {
      if (remember) await storage.write(STORAGE_KEYS.session, value);
      else await storage.remove(STORAGE_KEYS.session);
      persistent.current = remember;
      setSession(value);
      setChallenge(null);
      setError(null);
    },
    []
  );
  const signOut = useCallback(async () => {
    await storage.remove(STORAGE_KEYS.session);
    persistent.current = false;
    setSession(null);
    setChallenge(null);
  }, []);
  const updateProfile = useCallback(async (user: UserProfile) => {
    const value: PreviewSession = { mode: "preview", user };
    if (persistent.current) await storage.write(STORAGE_KEYS.session, value);
    setSession(value);
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
  if (!value) throw new Error("SessionProvider is missing.");
  return value;
}
