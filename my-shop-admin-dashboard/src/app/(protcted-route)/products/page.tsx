"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getFakeData } from "@/lib/data";
import ReUsebleTable from "@/components/shared/ReUsebleTable";
import ReUseblePagination from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";

const data = getFakeData();

export default function ProductsPage() {
  const [currentPage, setCurrentPage] = React.useState(1);

  const columns = [
    {
      header: "Product",
      accessorKey: "name",
      cell: (product: any) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shadow-sm">
            <Image 
              src={product.image} 
              alt={product.name} 
              fill
              className="object-cover" 
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm">{product.name}</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{product.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (product: any) => (
        <span className="text-sm font-medium text-slate-600">{product.category}</span>
      ),
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: (product: any) => (
        <span className="text-sm font-black text-slate-900">{product.price}</span>
      ),
    },
    {
      header: "Stock",
      accessorKey: "stock",
      cell: (product: any) => (
        <span className="text-sm text-slate-600 font-medium">{product.stock} units</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (product: any) => (
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          product.status === "In Stock" && "bg-emerald-50 text-emerald-600 border border-emerald-100",
          product.status === "Low Stock" && "bg-amber-50 text-amber-600 border border-amber-100",
          product.status === "Out of Stock" && "bg-red-50 text-red-600 border border-red-100"
        )}>
          {product.status}
        </span>
      ),
    },
  ];

  const actions = (product: any) => (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
        <Eye size={16} />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
        <Edit size={16} />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 rounded-lg">
        <Trash2 size={16} />
      </Button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-slate-500 font-medium text-sm">Manage your inventory and product listings.</p>
        </div>
        <Button asChild variant="premium" className="rounded-xl shadow-slate-200">
          <Link href="/products/new">
            <Plus size={18} className="mr-2" /> Add Product
          </Link>
        </Button>
      </div>

      <div className="space-y-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
        <ReUsebleTable
          data={data.products}
          columns={columns}
          actions={actions}
          searchPlaceholder="Search by product name, ID, or category..."
        />
        <ReUseblePagination
          currentPage={currentPage}
          totalPages={10}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
