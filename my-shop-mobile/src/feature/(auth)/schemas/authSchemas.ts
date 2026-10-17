import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.");
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Use no more than 128 characters.");
export const loginSchema = z.object({ email, password });
export const registerSchema = loginSchema
  .extend({
    name: z.string().trim().min(2, "Enter your full name."),
    confirmPassword: z.string(),
    acceptedTerms: z
      .boolean()
      .refine(Boolean, "Please accept the terms to continue."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export const forgotPasswordSchema = z.object({ email });
export const verificationSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter all 6 digits."),
});
export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type VerificationValues = z.infer<typeof verificationSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
