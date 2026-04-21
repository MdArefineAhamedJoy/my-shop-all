"use client";

import { useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import {
  IoChevronForward,
  IoClose,
  IoPersonOutline,
  IoSearchOutline,
} from "react-icons/io5";

const MobileMenu: React.FC = () => {
  const { isMobileMenuOpen, setMobileMenuOpen } = useStore();

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Shop All", href: "/shop" },
    { label: "Men", href: "/men" },
    { label: "Women", href: "/women" },
    { label: "New Arrivals", href: "/shop?tag=new-arrival" },
    { label: "Trending", href: "/shop?tag=trending" },
    { label: "Sale", href: "/shop?tag=sale" },
  ];

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 left-0 h-full w-[85%] max-w-sm bg-white z-50 md:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">
                <span className="text-[var(--color-primary)]">MY</span>
                <span className="text-[var(--color-accent)]">SHOP</span>
              </h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <IoClose size={28} />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:border-[var(--color-accent)] focus:outline-none"
                />
                <IoSearchOutline
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* Menu Items */}
            <nav className="p-6 space-y-2">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <span className="text-base font-medium">{item.label}</span>
                    <IoChevronForward
                      size={20}
                      className="text-gray-400 group-hover:text-[var(--color-accent)] transition-colors"
                    />
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Account Section */}
            <div className="p-6 border-t space-y-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-3 px-4 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                <IoPersonOutline size={24} />
                <span className="font-medium">Login / Sign Up</span>
              </Link>

              <div className="text-sm text-gray-600 space-y-2">
                <Link
                  href="/track-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block hover:text-[var(--color-accent)]"
                >
                  Track Order
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block hover:text-[var(--color-accent)]"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
