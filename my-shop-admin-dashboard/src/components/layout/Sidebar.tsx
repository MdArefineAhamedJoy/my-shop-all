"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Settings, 
  ChevronRight, 
  Package, 
  PlusCircle, 
  Layers,
  ChevronLeft,
  X,
  LogOut,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/contexts/SidebarContext";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    name: "Products",
    href: "/products",
    icon: ShoppingBag,
    submenu: [
      { name: "All Products", href: "/products", icon: Package },
      { name: "Add New", href: "/products/new", icon: PlusCircle },
    ],
  },
  { name: "Categories", href: "/categories", icon: Layers },
  { name: "Orders", href: "/orders", icon: ShoppingBag },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarContentProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  pathname: string;
  openSubmenu: string | null;
  setOpenSubmenu: (v: string | null) => void;
}

const SidebarContent = ({ 
  isCollapsed, 
  setIsCollapsed, 
  pathname, 
  openSubmenu, 
  setOpenSubmenu 
}: SidebarContentProps) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo Section */}
      <div className={cn(
        "flex items-center h-20 border-b border-slate-200/60 transition-all duration-300",
        isCollapsed ? "justify-center" : "px-6 gap-3"
      )}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200">
          <Store size={24} />
        </div>
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-black tracking-tight text-slate-900"
          >
            MYSHOP<span className="text-slate-400 font-bold">.</span>
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-8 px-2 sidebar-scroll">
        <div className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || item.submenu?.some(sub => sub.href === pathname);
            const isSubmenuOpen = openSubmenu === item.name;

            if (item.submenu) {
              if (isCollapsed) {
                // Dropdown for Collapsed Mode
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger
                      className={cn(
                        "w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 group relative outline-none",
                        isActive ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <item.icon size={22} className={cn("shrink-0", !isActive && "group-hover:scale-110 transition-transform")} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" sideOffset={20} className="w-56 p-1 rounded-xl shadow-2xl border-slate-100">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">{item.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-50" />
                        {item.submenu.map((sub) => (
                          <DropdownMenuItem key={sub.name} asChild>
                            <Link
                              href={sub.href}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all",
                                pathname === sub.href ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              )}
                            >
                              <sub.icon size={16} className="shrink-0" />
                              {sub.name}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <Collapsible
                  key={item.name}
                  open={isSubmenuOpen}
                  onOpenChange={() => setOpenSubmenu(isSubmenuOpen ? null : item.name)}
                  className="w-full"
                >
                  <CollapsibleTrigger
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-200 group relative outline-none",
                      isActive ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon size={20} className={cn("shrink-0", !isActive && "group-hover:scale-110 transition-transform")} />
                    <span className="text-sm font-bold flex-1 text-left">{item.name}</span>
                    <ChevronRight size={16} className={cn("transition-transform duration-200", isSubmenuOpen ? "rotate-90" : "")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-2 animate-collapsible-down overflow-hidden">
                    {item.submenu.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-3 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
                            isSubActive ? "text-slate-900 bg-slate-50" : "text-slate-400 hover:text-slate-900"
                          )}
                        >
                          <div className="w-5" /> {/* Spacer to align with parent icon */}
                          {sub.name}
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group",
                  isActive ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  isCollapsed ? "justify-center p-3" : "px-5 py-3"
                )}
              >
                <item.icon size={isCollapsed ? 22 : 20} className={cn("shrink-0", !isActive && "group-hover:scale-110 transition-transform")} />
                {!isCollapsed && <span className="text-sm font-bold">{item.name}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-200/60 bg-slate-50/50">
        <div className={cn(
          "flex items-center rounded-xl bg-white border border-slate-100 shadow-sm transition-all duration-300",
          isCollapsed ? "justify-center p-1.5" : "gap-3 p-2.5"
        )}>
          <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-slate-50">
            <Image
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
              alt="User"
              fill
              className="object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-slate-900 truncate">John Doe</p>
              <p className="text-[10px] font-bold text-slate-400 truncate">Admin Account</p>
            </div>
          )}
          {!isCollapsed && (
            <button className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          )}
        </div>
        
        <div className={cn("mt-4 flex transition-all duration-300", isCollapsed ? "justify-center" : "")}>
          {!isCollapsed ? (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Collapse Sidebar
            </button>
          ) : (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl border border-slate-100 transition-all"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    navigation.forEach(item => {
      if (item.submenu?.some(sub => sub.href === pathname)) {
        setOpenSubmenu(item.name);
      }
    });
  }, [pathname]);

  const sharedProps = {
    isCollapsed,
    setIsCollapsed,
    pathname,
    openSubmenu,
    setOpenSubmenu
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Desktop */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="fixed left-0 top-0 z-40 hidden h-screen border-r border-slate-200/60 bg-white md:block overflow-hidden shadow-[10px_0_40px_-15px_rgba(0,0,0,0.05)]"
      >
        <SidebarContent {...sharedProps} />
      </motion.aside>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-slate-200/60 bg-white shadow-2xl md:hidden"
          >
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-4 top-5 p-2 text-slate-400 hover:text-slate-900"
            >
              <X size={20} />
            </button>
            <SidebarContent {...sharedProps} isCollapsed={false} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
