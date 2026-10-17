import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Order } from "@/types/order";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderDetailsSheetProps {
  order: Order | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

const OrderDetailsSheet: React.FC<OrderDetailsSheetProps> = ({
  order,
  isOpen,
  onOpenChange,
  onStatusUpdate,
}) => {
  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            Order Details
            <span className="text-sm font-medium text-slate-400">#{order.id}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-8">
          {/* Customer Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Customer & Shipping</h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div>
                <p className="font-bold text-slate-900">{order.customer}</p>
                <p className="text-sm text-slate-500">{order.email}</p>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Shipping Address</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {order.shippingAddress || "123 Main St, Dhaka, Bangladesh"}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</h4>
              <div className={cn(
                "inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                order.status === "Delivered" && "bg-emerald-50 text-emerald-600 border-emerald-100",
                order.status === "Processing" && "bg-blue-50 text-blue-600 border-blue-100",
                order.status === "Shipped" && "bg-violet-50 text-violet-600 border-violet-100",
                order.status === "Cancelled" && "bg-red-50 text-red-600 border-red-100",
                order.status === "Returned" && "bg-amber-50 text-amber-600 border-amber-100"
              )}>
                {order.status}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment</h4>
              <div className={cn(
                "inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                order.payment === "Paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
              )}>
                {order.payment}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Order Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Items ({order.items})</span>
                <span className="font-bold text-slate-900">{order.total} TK</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Shipping</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Amount</span>
                <span className="text-xl font-black text-slate-900">{order.total} TK</span>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="pt-6 text-center">
            <p className="text-[10px] text-slate-400 font-medium">Order placed on {order.date}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Tracking Number</h4>
            <div className="relative">
              <Input 
                placeholder="Enter tracking number" 
                defaultValue={order.trackingNumber}
                className="h-12 bg-white border-slate-200 rounded-xl font-medium px-4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Update Status</h4>
            <Select 
              value={order.status} 
              onValueChange={(val) => onStatusUpdate?.(order.id, val)}
            >
              <SelectTrigger className="w-full h-12 bg-white border-slate-200 rounded-xl font-bold text-slate-900">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="Processing" className="font-bold">Processing</SelectItem>
                <SelectItem value="Shipped" className="font-bold">Shipped</SelectItem>
                <SelectItem value="Delivered" className="font-bold text-emerald-600">Delivered</SelectItem>
                <SelectItem value="Returned" className="font-bold text-amber-600">Returned</SelectItem>
                <SelectItem value="Cancelled" className="font-bold text-red-600">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailsSheet;
