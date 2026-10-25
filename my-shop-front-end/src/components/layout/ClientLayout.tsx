"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import MiniCart from "../cart/MiniCart";
import WishlistModal from "./WishlistModal";
import React from "react";
import { Toaster } from "sonner";
import { useStore } from "@/lib/store";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  React.useEffect(() => {
    void useStore.getState().refresh();
  }, [pathname]);
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    return (
      <main className="flex-1">
        <Toaster />
        {children}
      </main>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MiniCart />
      <WishlistModal />
      <Toaster position="top-center" richColors />
    </div>
  );
}
