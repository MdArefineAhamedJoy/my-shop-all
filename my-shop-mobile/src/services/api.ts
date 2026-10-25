import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
const base = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/v1"
).replace(/\/$/, "");
const key = "myshop.refresh.v1";
let credentials: { accessToken: string; refreshToken: string } | null = null;
let persistent = false;
let refreshing: Promise<void> | null = null;
const listeners = new Set<() => void>();
export const subscribeSignOut = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export async function rememberTokens(remember: boolean) {
  persistent = remember && Platform.OS !== "web";
  if (Platform.OS !== "web") {
    if (persistent && credentials)
      await SecureStore.setItemAsync(key, credentials.refreshToken);
    else await SecureStore.deleteItemAsync(key);
  }
}
export async function setTokens(value: {
  accessToken: string;
  refreshToken: string;
}) {
  credentials = value;
  if (persistent && Platform.OS !== "web")
    await SecureStore.setItemAsync(key, value.refreshToken);
}
export async function clearTokens() {
  credentials = null;
  persistent = false;
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key);
  listeners.forEach((fn) => fn());
}
async function raw(path: string, options: RequestInit = {}) {
  const res = await fetch(`${base}/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    signal: AbortSignal.timeout(20000),
  });
  const value = await res.json();
  if (!res.ok)
    throw new ApiError(value.error?.message || "Request failed", res.status);
  return value;
}
async function rotate() {
  const current = credentials;
  if (!credentials?.refreshToken) throw new ApiError("Please sign in", 401);
  const value = await raw("auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: credentials.refreshToken }),
  });
  if (credentials !== current) throw new ApiError("Session changed", 409);
  await setTokens(value.data);
}
export async function restoreTokens() {
  if (Platform.OS === "web") return false;
  const refreshToken = await SecureStore.getItemAsync(key);
  if (!refreshToken) return false;
  credentials = { accessToken: "", refreshToken };
  persistent = true;
  try {
    await rotate();
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) await clearTokens();
    throw e;
  }
}
export async function apiPage<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; meta: { nextCursor: string | null; hasMore: boolean } }> {
  const initialCredentials = credentials;
  const call = () =>
    raw(path, {
      ...options,
      headers: {
        ...(credentials
          ? { Authorization: `Bearer ${credentials.accessToken}` }
          : {}),
        ...options.headers,
      },
    });
  try {
    return await call();
  } catch (e) {
    if (
      !(e instanceof ApiError) ||
      e.status !== 401 ||
      !credentials ||
      credentials !== initialCredentials ||
      path.startsWith("auth/")
    )
      throw e;
    try {
      if (!refreshing)
        refreshing = rotate().finally(() => {
          refreshing = null;
        });
      await refreshing;
      return await call();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401)
        await clearTokens();
      throw error;
    }
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return (await apiPage<T>(path, options)).data;
}
export async function authenticate(path: "login" | "register", input: object) {
  const { data } = await raw(`auth/${path}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  await setTokens(data);
  return data.user as import("@/types/auth").UserProfile;
}
