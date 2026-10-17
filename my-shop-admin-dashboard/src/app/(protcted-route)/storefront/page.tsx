"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, Image as ImageIcon, Megaphone, Share2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { getFakeData } from "@/lib/data";

export default function StorefrontPage() {
  const data = getFakeData();
  const [formData, setFormData] = useState(data.settings);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBanner = () => {
    const url = prompt("Enter banner image URL:");
    if (url) {
      const newBanner = { id: Date.now(), title: "New Campaign", image: url, active: true };
      setFormData((prev) => ({
        ...prev,
        banners: [...prev.banners, newBanner]
      }));
      toast.success("Banner added successfully");
    }
  };

  const handleRemoveBanner = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      banners: prev.banners.filter(b => b.id !== id)
    }));
    toast.error("Banner removed");
  };

  const handleSave = () => {
    console.log("Saving Storefront settings:", formData);
    toast.success("Storefront settings saved globally!");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Storefront</h1>
          <p className="text-slate-500 font-medium text-sm">Manage your homepage banners, announcements, and site-wide content.</p>
        </div>
        <Button variant="premium" className="rounded-xl shadow-slate-200" onClick={handleSave}>
          <Save size={18} className="mr-2" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Banner Management */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Homepage Banners</CardTitle>
                    <CardDescription>Main slider images for your store home.</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg h-9 font-bold" onClick={handleAddBanner}>
                  <Plus size={16} className="mr-1" /> Add Banner
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.banners.map((banner) => (
                  <div key={banner.id} className="relative group rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-[2/1]">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div className="text-white">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Campaign</p>
                        <p className="text-sm font-bold truncate">{banner.title}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-white/20 hover:bg-red-500 text-white rounded-lg backdrop-blur-md border border-white/20"
                        onClick={() => handleRemoveBanner(banner.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Megaphone size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg">Announcement Bar</CardTitle>
                  <CardDescription>Top bar message shown across the whole site.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Message Text</Label>
                  <Input 
                    name="announcement"
                    value={formData.announcement} 
                    onChange={handleInputChange}
                    className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all font-medium"
                    placeholder="Enter announcement..."
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Currently Active</span>
                  </div>
                  <Badge variant="outline" className="bg-white text-emerald-600 border-emerald-200">Live on Site</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                  <Share2 size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg">Social Links</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facebook</Label>
                <Input 
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleInputChange}
                  placeholder="https://facebook.com/myshop" 
                  className="rounded-xl bg-slate-50 border-slate-100" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instagram</Label>
                <Input 
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/myshop" 
                  className="rounded-xl bg-slate-50 border-slate-100" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Twitter/X</Label>
                <Input 
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/myshop" 
                  className="rounded-xl bg-slate-50 border-slate-100" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-lg">Store Info</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Email</Label>
                <Input 
                  name="storeEmail"
                  value={formData.storeEmail}
                  onChange={handleInputChange}
                  className="rounded-xl bg-slate-50 border-slate-100" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Support Phone</Label>
                <Input 
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="rounded-xl bg-slate-50 border-slate-100" 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
