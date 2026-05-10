"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProductForm from "./ProductForm";
import { useState } from "react";

export default function AddProductModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="premium" className="rounded-xl shadow-slate-200">
          <Plus size={18} className="mr-2" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl p-0 gap-0">
        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-800">Add New Product</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium text-sm">
              Create a new product listing in your store.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-6">
          <ProductForm 
            onSuccess={() => setOpen(false)} 
            onCancel={() => setOpen(false)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
