import type { AuthService } from "@/types/auth";
import { api, authenticate } from "./api";
export const authService: AuthService = {
  async login(input) {
    return {
      mode: "live",
      user: await authenticate("login", {
        email: input.email,
        password: input.password,
        ...(input.mfaCode ? { mfaCode: input.mfaCode } : {}),
      }),
    };
  },
  async register(input) {
    return {
      mode: "live",
      user: await authenticate("register", {
        name: input.name,
        email: input.email,
        password: input.password,
      }),
    };
  },
  async requestReset(email) {
    await api("auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { email, id: "", expiresAt: Date.now() + 1800000, verified: false };
  },
  async verifyCode(challenge, token) {
    await api("auth/password-reset/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    return { ...challenge, id: token, verified: true };
  },
  async resetPassword(challenge, password) {
    await api("auth/password-reset/complete", {
      method: "POST",
      body: JSON.stringify({ token: challenge.id, newPassword: password }),
    });
  },
};
