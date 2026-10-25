import * as z from "zod";

export const orderSchema = z.object({
  customer: z.string().min(2, "Customer name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  total: z.coerce.number<number>().min(1, "Total must be at least 1"),
  items: z.coerce.number<number>().min(1, "Items must be at least 1"),
  status: z.enum([
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ]),
  payment: z.enum(["Paid", "Unpaid", "Pending"]),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
