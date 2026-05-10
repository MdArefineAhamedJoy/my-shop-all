"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import ProductForm from "@/components/products/ProductForm";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4">
        <Link
          href="/products"
          className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group w-fit"
        >
          <ChevronLeft
            size={18}
            className="mr-1 group-hover:-translate-x-1 transition-transform"
          />
          Back to Products
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Add New Product
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Create a new product listing in your store.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <ProductForm 
          onSuccess={() => router.push("/products")} 
          onCancel={() => router.push("/products")} 
        />
      </div>
    </div>
  );
}
