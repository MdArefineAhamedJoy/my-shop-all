"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Customer } from "@/types/customer";
import { Mail, Phone, Calendar, ShoppingBag, CreditCard } from "lucide-react";

interface CustomerDetailsSheetProps {
  customer: Customer | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomerDetailsSheet: React.FC<CustomerDetailsSheetProps> = ({
  customer,
  isOpen,
  onOpenChange,
}) => {
  if (!customer) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">Customer Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={cn(
              "w-24 h-24 rounded-3xl flex items-center justify-center font-bold text-2xl shadow-xl border-4 border-white",
              customer.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
            )}>
              {customer.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{customer.name}</h3>
              <p className="text-sm text-slate-500 font-medium">{customer.email}</p>
            </div>
            <Badge variant={customer.status === "Active" ? "premium" : "secondary"} className="rounded-full px-4 py-1">
              {customer.status} Account
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-2 bg-white rounded-lg text-slate-400">
                <Mail size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
                <span className="text-sm font-semibold text-slate-900">{customer.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-2 bg-white rounded-lg text-slate-400">
                <Phone size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</span>
                <span className="text-sm font-semibold text-slate-900">+880 1712-345678</span>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-1">
              <ShoppingBag size={20} className="text-blue-500 mb-2" />
              <p className="text-2xl font-black text-slate-900">{customer.orders}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
            </div>
            <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-1">
              <CreditCard size={20} className="text-emerald-500 mb-2" />
              <p className="text-2xl font-black text-slate-900">{customer.spent}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Spent</p>
            </div>
          </div>

          {/* History / Timeline */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Customer History</h4>
            <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              <div className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-4 border-slate-900 shadow-sm" />
                <p className="text-sm font-bold text-slate-900">Account Created</p>
                <p className="text-xs text-slate-500 font-medium">October 12, 2023</p>
              </div>
              <div className="relative pl-8">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 shadow-sm" />
                <p className="text-sm font-bold text-slate-900">Last Purchase Made</p>
                <p className="text-xs text-slate-500 font-medium">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CustomerDetailsSheet;
