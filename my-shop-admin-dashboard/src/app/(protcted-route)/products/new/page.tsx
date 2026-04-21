"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Image as ImageIcon, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NewProductPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4">
        <Link href="/products" className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group w-fit">
          <ChevronLeft size={18} className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add New Product</h1>
            <p className="text-slate-500 font-medium text-sm">Create a new product listing in your store.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl">Discard</Button>
            <Button variant="premium" className="rounded-xl shadow-slate-200">
              <Save size={18} className="mr-2" /> Save Product
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Main product details that will be visible to customers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Classic Silk Shirt"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  rows={6}
                  placeholder="Describe the product features, material, and fit..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all resize-none font-medium"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Upload high-quality images of your product.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Upload Placeholder */}
                <button className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-900 hover:border-slate-900/20 hover:bg-slate-50 transition-all group">
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                </button>
                
                {/* Mock Uploaded Images */}
                {[
                  "1521572267360-ee0c2909d518",
                  "1624371414361-e6e0efc5836f"
                ].map((imgId, i) => (
                  <div key={imgId} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100 shadow-sm">
                    <Image 
                      src={`https://images.unsplash.com/photo-${imgId}?w=200&h=200&fit=crop`} 
                      alt="Product preview" 
                      fill
                      className="object-cover" 
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-white text-slate-900 hover:bg-white/90">
                        <ImageIcon size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 text-white hover:bg-red-600 border-none">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all appearance-none font-bold">
                  <option>Mens Fashion</option>
                  <option>Womens Fashion</option>
                  <option>Accessories</option>
                  <option>Footwear</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["New Arrival", "Summer"].map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      {tag} <X size={10} className="cursor-pointer" />
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tags..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-medium"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Quantity</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
