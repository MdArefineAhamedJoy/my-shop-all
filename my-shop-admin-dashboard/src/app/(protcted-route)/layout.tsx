"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-slate-900 selection:text-white overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Sidebar - Handles its own desktop/mobile visibility */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* <Header /> */}
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-10 max-w-full mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
