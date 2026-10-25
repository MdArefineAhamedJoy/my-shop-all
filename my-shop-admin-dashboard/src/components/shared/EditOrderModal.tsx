"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import { Save } from "lucide-react";

const formSchema = z.object({
  customer: z.string().min(2, "Customer name is required"),
  email: z.string().email("Invalid email address"),
  total: z.coerce.number<number>().min(1, "Total must be at least 1"),
  shippingAddress: z.string().min(5, "Address is required"),
});

interface EditOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, values: z.infer<typeof formSchema>) => void;
}

export default function EditOrderModal({
  order,
  isOpen,
  onOpenChange,
  onSubmit,
}: EditOrderModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer: "",
      email: "",
      total: 0,
      shippingAddress: "",
    },
  });

  useEffect(() => {
    if (order) {
      form.reset({
        customer: order.customer,
        email: order.email,
        total: order.total,
        shippingAddress:
          order.shippingAddress || "123 Main St, Dhaka, Bangladesh",
      });
    }
  }, [order, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (order) {
      onSubmit(order.id, values);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Edit Order #{order?.id}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-400 uppercase">
                    Customer Name
                  </FormLabel>
                  <FormControl>
                    <Input {...field} className="rounded-xl h-12 bg-slate-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-400 uppercase">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input {...field} className="rounded-xl h-12 bg-slate-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-slate-400 uppercase">
                      Total Amount (TK)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        className="rounded-xl h-12 bg-slate-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold text-slate-400 uppercase">
                    Shipping Address
                  </FormLabel>
                  <FormControl>
                    <Input {...field} className="rounded-xl h-12 bg-slate-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="premium"
                className="rounded-xl font-bold px-8 shadow-slate-200"
              >
                <Save size={18} className="mr-2" /> Update Order
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
