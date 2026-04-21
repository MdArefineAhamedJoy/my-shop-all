"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Toaster } from "sonner";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-slate-900 selection:text-white">
      <Toaster position="top-right" />
      
      {/* Sidebar - Handles its own desktop/mobile visibility */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
          isCollapsed ? "md:pl-20" : "md:pl-[280px]"
        )}
      >
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
