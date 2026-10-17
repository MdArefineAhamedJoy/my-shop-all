"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, 
  Search, 
  ArrowLeftRight,
  User,
  Package,
  Calendar,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import ordersData from "@/data/orders.json";
import { getFakeData } from "@/lib/data";
import ReUsebleTable from "@/components/shared/ReUsebleTable";
import ReUseblePagination from "@/components/shared/Pagination";

export default function ReturnsPage() {
  const data = getFakeData();
  // Filter orders that are marked as Returned
  // (In a real app, you might have a separate Returns table, 
  // but for now we filter orders with status 'Returned')
  const returns = data.orders.filter(o => o.status === "Returned" || o.status === "Cancelled").map(o => ({
    ...o,
    returnDate: "2024-05-10", // Mock return date
    reason: "Damaged Product"  // Mock reason
  }));

  const [currentPage, setCurrentPage] = useState(1);

  const columns = [
    {
      header: "Customer",
      accessorKey: "customer",
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            <User size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm">{item.customer}</span>
            <span className="text-[10px] text-slate-400 font-medium">{item.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Product / ID",
      accessorKey: "id",
      cell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm">Product Refund</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.id}</span>
        </div>
      ),
    },
    {
      header: "Reason",
      accessorKey: "reason",
      cell: (item: any) => (
        <div className="flex items-center gap-1.5 text-amber-600">
          <AlertCircle size={14} />
          <span className="text-sm font-medium">{item.reason}</span>
        </div>
      ),
    },
    {
      header: "Return Date",
      accessorKey: "returnDate",
      cell: (item: any) => (
        <span className="text-sm text-slate-500 font-medium">{item.returnDate}</span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: (item: any) => (
        <span className="text-sm font-black text-slate-900">{item.total}</span>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Product Returns</h1>
          <p className="text-slate-500 font-medium text-sm">Manage and track returned products and customer refunds.</p>
        </div>
        <Button variant="premium" className="rounded-xl shadow-slate-200">
          <RotateCcw size={18} className="mr-2" /> Manual Return
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Returns</p>
            <p className="text-3xl font-black">{returns.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Refunded Amount</p>
            <p className="text-3xl font-black">12,450 TK</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pending Inspection</p>
            <p className="text-3xl font-black">2</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search returns..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
            />
          </div>
          <Button variant="ghost" size="sm" className="font-bold text-slate-500">Export CSV</Button>
        </div>
        <ReUsebleTable
          data={returns}
          columns={columns}
        />
        <ReUseblePagination
          currentPage={currentPage}
          totalPages={1}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
