"use client";
import { Checkbox } from "@/components/ui/checkbox";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateProductRequest } from "@/types/product";
import {
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: "",
    slug: "",
    description: "",
    price: 0,
    originalPrice: 0,
    category: "",
    subcategory: "",
    gender: "unisex",
    tags: [],
    images: [],
    sizes: [],
    colors: [],
    stock: 0,
    sku: "",
    isFeatured: false,
    isNew: false,
  });

  const [newTag, setNewTag] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === "number" ? parseFloat(value) || 0 : value;

    setFormData((prev) => {
      const nextData = {
        ...prev,
        [name]: newValue,
      };

      // Auto-generate slug from name if it's the name field
      if (name === "name" && typeof newValue === "string") {
        nextData.slug = newValue
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }

      return nextData;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addItem = (
    field: "tags" | "sizes" | "colors",
    value: string,
    setter: (val: string) => void,
  ) => {
    if (value && !(formData[field] ?? []).includes(value)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field] ?? []), value],
      }));
      setter("");
    }
  };

  const removeItem = (field: "tags" | "sizes" | "colors", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] ?? []).filter((item) => item !== value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting product:", formData);
    // Add API call here
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-none bg-slate-50/50">
            <CardHeader className="px-4 py-4">
              <CardTitle className="text-lg">General Information</CardTitle>
              <CardDescription>
                Main product details that will be visible to customers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Product Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Classic Silk Shirt"
                    className="bg-white border-slate-100 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="slug"
                    className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Slug
                  </Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="classic-silk-shirt"
                    className="bg-white border-slate-100 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe the product features..."
                  className="bg-white border-slate-100 rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="sku"
                    className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="e.g. SH-001"
                    className="bg-white border-slate-100 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="gender"
                    className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  >
                    Gender
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(val) => handleSelectChange("gender", val)}
                  >
                    <SelectTrigger className="bg-white border-slate-100 rounded-xl font-medium h-10">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none bg-slate-50/50">
            <CardHeader className="px-4 py-4">
              <CardTitle className="text-lg">Attributes & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Sizes
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        placeholder="Add size"
                        className="bg-white border-slate-100 rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem("sizes", newSize, setNewSize);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => addItem("sizes", newSize, setNewSize)}
                        variant="outline"
                        className="rounded-xl px-3"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.sizes ?? []).map((size) => (
                        <Badge
                          key={size}
                          variant="secondary"
                          className="px-3 py-1 rounded-lg gap-2"
                        >
                          {size}
                          <X
                            size={14}
                            className="cursor-pointer hover:text-red-500"
                            onClick={() => removeItem("sizes", size)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Colors
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        placeholder="Add color"
                        className="bg-white border-slate-100 rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem("colors", newColor, setNewColor);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => addItem("colors", newColor, setNewColor)}
                        variant="outline"
                        className="rounded-xl px-3"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(formData.colors ?? []).map((color) => (
                        <Badge
                          key={color}
                          variant="secondary"
                          className="px-3 py-1 rounded-lg gap-2"
                        >
                          {color}
                          <X
                            size={14}
                            className="cursor-pointer hover:text-red-500"
                            onClick={() => removeItem("colors", color)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Images
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button 
                      type="button" 
                      onClick={() => {
                        const url = prompt("Enter image URL:");
                        if (url) {
                          setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
                        }
                      }}
                      className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-900 hover:border-slate-900/20 hover:bg-slate-50 transition-all group"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Add Image</span>
                    </button>
                    
                    {(formData.images ?? []).map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 shadow-sm">
                        <Image
                          src={img}
                          alt={`Product preview ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-red-500 text-white hover:bg-red-600 border-none rounded-lg"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx)
                              }));
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <Card className="border-none shadow-none bg-slate-50/50">
            <CardHeader className="px-4 py-4">
              <CardTitle className="text-base">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => handleSelectChange("category", val)}
                >
                  <SelectTrigger className="bg-white border-slate-100 rounded-xl font-medium h-10">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shirt">Shirts</SelectItem>
                    <SelectItem value="pants">Pants</SelectItem>
                    <SelectItem value="t-shirt">T-Shirts</SelectItem>
                    <SelectItem value="polo">Polo Shirts</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Tags
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tags"
                    className="bg-white border-slate-100 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem("tags", newTag, setNewTag);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addItem("tags", newTag, setNewTag)}
                    variant="outline"
                    className="rounded-xl px-3"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.tags ?? []).map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-slate-800 text-white text-[10px] font-semibold rounded-lg uppercase tracking-wider gap-1"
                    >
                      {tag}
                      <X
                        size={10}
                        className="cursor-pointer"
                        onClick={() => removeItem("tags", tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none bg-slate-50/50">
            <CardHeader className="px-4 py-4">
              <CardTitle className="text-base">Visibility & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="isFeatured" 
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isFeatured: !!checked }))
                  }
                  className="rounded-md border-slate-200"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="isFeatured" className="text-sm font-bold text-slate-900 cursor-pointer">
                    Featured Product
                  </Label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Show this product in the homepage featured section.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="isNew" 
                  checked={formData.isNew}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isNew: !!checked }))
                  }
                  className="rounded-md border-slate-200"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="isNew" className="text-sm font-bold text-slate-900 cursor-pointer">
                    New Arrival
                  </Label>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Mark this product as a new arrival.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none bg-slate-50/50">
            <CardHeader className="px-4 py-4">
              <CardTitle className="text-base">Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4">
              <div className="space-y-2">
                <Label
                  htmlFor="price"
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Price
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                    $
                  </span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="pl-8 bg-white border-slate-100 rounded-xl font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="stock"
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                >
                  Stock
                </Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="bg-white border-slate-100 rounded-xl font-semibold"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button 
          type="button" 
          variant="outline" 
          className="rounded-xl"
          onClick={onCancel}
        >
          Discard
        </Button>
        <Button
          type="submit"
          variant="premium"
          className="rounded-xl shadow-slate-200"
        >
          <Save size={18} className="mr-2" /> Save Product
        </Button>
      </div>
    </form>
  );
}
