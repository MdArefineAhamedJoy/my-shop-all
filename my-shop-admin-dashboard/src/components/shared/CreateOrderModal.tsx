"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { orderSchema, OrderFormValues } from "@/lib/validations/order";
import ReUsebleModal from "./ReUsebleModal";

interface CreateOrderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: OrderFormValues) => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
}) => {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer: "",
      email: "",
      total: 0,
      items: 1,
      status: "Pending",
      payment: "Unpaid",
    },
  });

  const handleFormSubmit = (values: OrderFormValues) => {
    onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <ReUsebleModal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      title="Create New Order"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-bold">Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} className="h-11 rounded-sm border-slate-200" />
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
                  <FormLabel className="text-slate-900 font-bold">Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} className="h-11 rounded-sm border-slate-200" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-bold">Total Amount (TK)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} className="h-11 rounded-sm border-slate-200" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="items"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-bold">Number of Items</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} className="h-11 rounded-sm border-slate-200" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-bold">Order Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-sm border-slate-200">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-900 font-bold">Payment Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-sm border-slate-200">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-sm font-bold"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-11 rounded-sm font-bold px-8">
              Create Order
            </Button>
          </div>
        </form>
      </Form>
    </ReUsebleModal>
  );
};

export default CreateOrderModal;
