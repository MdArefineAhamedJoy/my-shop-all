"use client";

import ProductCard from "@/components/product/ProductCard";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import React from "react";
import { useIsMounted } from "@/hooks/useIsMounted";
import { IoHeartOutline, IoSparklesOutline } from "react-icons/io5";

const WishlistPage = () => {
  const { wishlist } = useStore();
  const mounted = useIsMounted();

  if (!mounted) return null;

  return (
    <div 
        className="min-h-screen bg-white"
        style={{ paddingTop: "var(--header-height, 80px)" }}
    >
      {/* Hero Header */}
      <section className="bg-gray-50 py-20 md:py-32 overflow-hidden relative">
        <div className="container relative z-10 text-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="flex items-center justify-center gap-2 mb-4">
                    <IoSparklesOutline className="text-orange-500" size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-orange-600">Personal Archive</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-serif italic text-[#1c1c1c] mb-6">Your Wishlist</h1>
                <div className="w-24 h-px bg-black/10 mx-auto" />
                <p className="mt-8 text-gray-500 max-w-lg mx-auto text-sm leading-relaxed tracking-wide">
                    A curated collection of pieces that resonate with your unique presence. 
                    Your future style, saved for the perfect moment.
                </p>
            </motion.div>
        </div>
        
        {/* Background text decoration */}
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 text-[200px] font-black text-black/[0.02] uppercase pointer-events-none select-none hidden lg:block">
            Desire
        </div>
      </section>

      {/* Grid Section */}
      <section className="container py-20 pb-40">
        <AnimatePresence mode="wait">
          {wishlist.length > 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
            >
              {wishlist.map((item, index) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={item.product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-40 text-center"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                <IoHeartOutline size={32} className="text-gray-200" />
              </div>
              <h2 className="text-2xl font-serif italic text-gray-900 mb-4">Your Archive is Empty</h2>
              <p className="text-gray-500 max-w-xs mx-auto text-sm mb-10 leading-relaxed">
                You haven&apos;t saved any pieces yet. Explore our latest collections 
                to build your personal style dictionary.
              </p>
              <Link
                href="/shop"
                className="px-10 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl active:scale-95"
              >
                Start Exploring
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default WishlistPage;
