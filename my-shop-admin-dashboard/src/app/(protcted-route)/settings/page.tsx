"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, User, Bell, Shield, CreditCard, Store, Save, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "general", name: "General", icon: Settings },
  { id: "profile", name: "Profile", icon: User },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "security", name: "Security", icon: Shield },
  { id: "billing", name: "Billing", icon: CreditCard },
];

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500 font-medium text-sm">Manage your store preferences and account settings.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full lg:w-64 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold",
                  section.id === "general" 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <section.icon size={18} />
                {section.name}
              </button>
            ))}
          </aside>

          {/* Main Settings Content */}
          <div className="flex-1 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Update your store's basic information and branding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Store Name</label>
                    <input
                      type="text"
                      defaultValue="MyShop Official"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Store Email</label>
                    <input
                      type="email"
                      defaultValue="hello@myshop.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Store Description</label>
                    <textarea
                      rows={3}
                      defaultValue="Premium fashion clothing brand for modern lifestyle."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all resize-none"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t border-slate-50 py-4 px-6 flex justify-end gap-3 rounded-b-2xl">
                <Button variant="outline" className="rounded-lg h-9 text-xs">Cancel</Button>
                <Button variant="premium" className="rounded-lg h-9 text-xs">
                  <Save size={14} className="mr-2" /> Save Changes
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>Manage your store's external service integrations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Strapi CMS", status: "Connected", icon: Store, color: "bg-violet-50 text-violet-600" },
                  { name: "Stripe Payments", status: "Connected", icon: CreditCard, color: "bg-blue-50 text-blue-600" },
                  { name: "Google Analytics", status: "Not Connected", icon: ExternalLink, color: "bg-slate-50 text-slate-400" },
                ].map((app) => (
                  <div key={app.name} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-lg", app.color)}>
                        <app.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{app.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{app.status}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg text-[10px] font-bold h-8">Configure</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
