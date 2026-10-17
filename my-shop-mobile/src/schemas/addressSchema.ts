import { z } from "zod";

export const addressSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => /^(?:\+?88)?01[3-9]\d{8}$/.test(value.replace(/[\s-]/g, "")),
      "Enter a valid Bangladesh mobile number."
    ),
  address: z.string().trim().min(1, "Enter your street address."),
  city: z.string().trim().min(1, "Enter your city."),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter a 4 digit postal code."),
});
