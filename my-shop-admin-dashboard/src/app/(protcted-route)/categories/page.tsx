"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Layers, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFakeData } from "@/lib/data";
import ReUseableModal from "@/components/shared/ReUseableModal";

const data = getFakeData();

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Categories</h1>
          <p className="text-slate-500 font-medium text-sm">Organize your products into logical categories.</p>
        </div>
        <Button 
          variant="premium" 
          className="rounded-xl shadow-slate-200"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} className="mr-2" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.categories.map((category) => (
          <Card key={category.id} className="border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Layers size={20} />
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-lg">
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 rounded-lg">
                  <Trash2 size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="mb-1 text-lg">{category.name}</CardTitle>
              <CardDescription className="mb-4 text-[10px] font-bold uppercase tracking-widest">{category.id}</CardDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{category.products} Products</span>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  category.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-600"
                )}>
                  {category.status}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-slate-900 hover:border-slate-900/20 hover:bg-slate-50 transition-all group"
        >
          <div className="p-3 bg-slate-50 rounded-full group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="font-bold text-sm">Add New Category</span>
        </button>
      </div>

      {/* Reusable Modal Example */}
      <ReUseableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Category"
        description="Add a new category to organize your product inventory."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold text-slate-500">
              Cancel
            </Button>
            <Button variant="premium" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold px-6">
              <Save size={16} className="mr-2" /> Save Category
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Winter Collection"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Slug (Optional)</label>
            <input
              type="text"
              placeholder="e.g. winter-collection"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-medium"
            />
          </div>
        </div>
      </ReUseableModal>
    </div>
  );
}
