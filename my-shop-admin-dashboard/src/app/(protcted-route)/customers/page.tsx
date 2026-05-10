"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Eye, UserPlus, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFakeData } from "@/lib/data";
import ReUsebleTable from "@/components/shared/ReUsebleTable";
import ReUseblePagination from "@/components/shared/Pagination";
import { Customer } from "@/types/customer";

const data = getFakeData();

export default function CustomersPage() {
  const [currentPage, setCurrentPage] = React.useState(1);

  const columns = [
    {
      header: "Customer",
      accessorKey: "name",
      cell: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm",
            customer.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-600"
          )}>
            {customer.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm">{customer.name}</span>
            <span className="text-[10px] text-slate-400 font-medium">{customer.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (customer: Customer) => (
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          customer.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-600 border border-slate-200"
        )}>
          {customer.status}
        </span>
      ),
    },
    {
      header: "Orders",
      accessorKey: "orders",
      cell: (customer: Customer) => (
        <span className="text-sm font-medium text-slate-600">{customer.orders} orders</span>
      ),
    },
    {
      header: "Total Spent",
      accessorKey: "spent",
      cell: (customer: Customer) => (
        <span className="text-sm font-black text-slate-900">{customer.spent}</span>
      ),
    },
  ];

  const actions = () => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
        <Mail size={16} />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
        <Phone size={16} />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
        <Eye size={16} />
      </Button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 font-medium text-sm">Manage your customer relationships and view their history.</p>
        </div>
        <Button variant="premium" className="rounded-xl shadow-slate-200">
          <UserPlus size={18} className="mr-2" /> Add Customer
        </Button>
      </div>

      <div className="space-y-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <ReUsebleTable
          data={data.customers}
          columns={columns}
          actions={actions}
          searchPlaceholder="Search by name, email, or status..."
        />
        <ReUseblePagination
          currentPage={currentPage}
          totalPages={3}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
