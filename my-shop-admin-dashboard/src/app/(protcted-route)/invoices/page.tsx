"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileText, 
  Search, 
  Printer, 
  ExternalLink,
  Filter,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFakeData } from "@/lib/data";
import ReUsebleTable from "@/components/shared/ReUsebleTable";
import { toast } from "sonner";

export default function InvoicesPage() {
  const data = getFakeData();
  const [searchTerm, setSearchTerm] = useState("");

  const handleDownload = (id: string) => {
    toast.success(`Downloading Invoice #${id}...`);
    // Logic for PDF generation would go here
  };

  const columns = [
    {
      header: "Invoice No",
      accessorKey: "id",
      cell: (order: any) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
            <FileText size={14} />
          </div>
          <span className="font-bold text-slate-900 text-sm">{order.id.replace('ORD', 'INV')}</span>
        </div>
      ),
    },
    {
      header: "Customer",
      accessorKey: "customer",
      cell: (order: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm">{order.customer}</span>
          <span className="text-[10px] text-slate-400 font-medium">{order.email}</span>
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (order: any) => (
        <span className="text-sm text-slate-500 font-medium">{order.date}</span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "total",
      cell: (order: any) => (
        <span className="text-sm font-black text-slate-900">{order.total}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (order: any) => (
        <Badge status={order.status} />
      ),
    },
  ];

  const actions = (order: any) => (
    <div className="flex items-center justify-end gap-2">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg"
        onClick={() => handleDownload(order.id)}
      >
        <Download size={16} />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
        <Printer size={16} />
      </Button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Invoices & Slips</h1>
          <p className="text-slate-500 font-medium text-sm">View and download sales receipts for your orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold text-slate-600">
            <Filter size={18} className="mr-2" /> Filter
          </Button>
          <Button variant="premium" className="rounded-xl shadow-slate-200">
            <ArrowUpRight size={18} className="mr-2" /> Bulk Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-slate-900 text-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Sales Slip</p>
            <p className="text-3xl font-black">{data.orders.length}</p>
            <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
              <ArrowUpRight size={12} />
              <span>+12% this month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pending Slips</p>
            <p className="text-3xl font-black">{data.orders.filter(o => o.status === "Processing").length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Exported Slips</p>
            <p className="text-3xl font-black">1,240</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by Invoice ID or Customer..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ReUsebleTable
          data={data.orders}
          columns={columns}
          actions={actions}
        />
      </div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
      status === "Delivered" && "bg-emerald-50 text-emerald-600 border border-emerald-100",
      status === "Processing" && "bg-blue-50 text-blue-600 border border-blue-100",
      status === "Shipped" && "bg-violet-50 text-violet-600 border border-violet-100",
      status === "Cancelled" && "bg-red-50 text-red-600 border border-red-100"
    )}>
      {status}
    </span>
  );
}
