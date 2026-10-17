import type { AuthService } from "@/types/auth";

export const PREVIEW_OTP = "123456";

function checkChallenge(expiresAt: number) {
  if (Date.now() > expiresAt)
    throw new Error("This code has expired. Request a new code.");
}

// Frontend adapter only. It never stores passwords, creates tokens, or sends requests.
// Replace this object with an implementation of AuthService after API design.
export const authService: AuthService = {
  async login({ email }) {
    return {
      mode: "preview",
      user: {
        id: "preview-customer",
        email: email.trim().toLowerCase(),
        name: email.split("@")[0].replace(/[._-]/g, " "),
      },
    };
  },
  async register({ name, email }) {
    return {
      mode: "preview",
      user: {
        id: "preview-customer",
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
    };
  },
  async requestReset(email) {
    return {
      email: email.trim().toLowerCase(),
      id: `preview-${Date.now()}`,
      expiresAt: Date.now() + 300_000,
      verified: false,
    };
  },
  async verifyCode(challenge, code) {
    checkChallenge(challenge.expiresAt);
    if (code !== PREVIEW_OTP)
      throw new Error("That code is incorrect. Please try again.");
    return { ...challenge, verified: true };
  },
  async resetPassword(challenge) {
    checkChallenge(challenge.expiresAt);
    if (!challenge.verified)
      throw new Error("Verify your code before resetting your password.");
  },
};
