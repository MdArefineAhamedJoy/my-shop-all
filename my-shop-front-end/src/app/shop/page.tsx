"use client";

import ProductCard from "@/components/product/ProductCard";
import ShopDiscoveryBar from "@/components/shop/ShopDiscoveryBar";
import { MOCK_PRODUCTS } from "@/lib/mockData";
import { AnimatePresence, motion } from "framer-motion";
import { use, useEffect, useMemo, useState } from "react";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    gender?: string;
    tag?: string;
    priceMax?: string;
  }>;
}

const ITEMS_PER_PAGE = 16;

export default function ShopPage({ searchParams }: ShopPageProps) {
  const params = use(searchParams);
  const { category, gender, tag, priceMax } = params;

  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [internalSortBy, setInternalSortBy] = useState<string>("newest");
  const [localPriceRange, setLocalPriceRange] = useState({ min: "", max: "" });

  // Sync scroll on page change
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }
  }, [currentPage]);

  // Combined Strict & Internal Filter Logic
  const filteredProducts = useMemo(() => {
    let filtered = [...MOCK_PRODUCTS];

    // 1. URL Parameter Filters (Strict)
    if (category) {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase(),
      );
    }
    if (gender) {
      filtered = filtered.filter(
        (p) => p.gender.toLowerCase() === gender.toLowerCase(),
      );
    }
    if (tag) {
      filtered = filtered.filter((p) => p.tags?.includes(tag));
    }
    if (priceMax) {
      filtered = filtered.filter((p) => p.price <= parseInt(priceMax));
    }

    // 2. Internal Discovery Filters (Local)
    if (localSearchQuery) {
      const q = localSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    // 3. Local Price Range Filter
    if (localPriceRange.min) {
      filtered = filtered.filter(
        (p) => p.price >= parseInt(localPriceRange.min),
      );
    }
    if (localPriceRange.max) {
      filtered = filtered.filter(
        (p) => p.price <= parseInt(localPriceRange.max),
      );
    }

    // 4. Internal Sorting
    switch (internalSortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        // Already sorted by newest in mock data usually
        break;
    }

    return filtered;
  }, [
    category,
    gender,
    tag,
    priceMax,
    localSearchQuery,
    internalSortBy,
    localPriceRange,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const viewTitle = useMemo(() => {
    if (category) {
      const catName = category.charAt(0).toUpperCase() + category.slice(1);
      if (gender)
        return `${gender.charAt(0).toUpperCase() + gender.slice(1)}'s ${catName}`;
      return `${catName} Collection`;
    }
    if (gender)
      return `${gender.charAt(0).toUpperCase() + gender.slice(1)}'s Collection`;
    if (tag)
      return tag
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    return "The Archive";
  }, [category, gender, tag]);

  return (
    <div
      className="bg-white min-h-screen selection:bg-black selection:text-white"
      style={{ paddingTop: "var(--header-height, 80px)" }}
    >
      {/* Cinematic Hero Header - Reduced Height */}
      <section className="relative h-[20vh] md:h-[25vh] flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
        </div>

        <div className="container relative z-10 text-center px-4">
          <motion.div
            key={viewTitle}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-orange-600 mb-3 block">
              Archive Selection
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-medium text-black tracking-tighter leading-none mb-4">
              {viewTitle}
              <span className="text-orange-600">.</span>
            </h1>
            <div className="h-px w-12 bg-black mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* Unified Discovery Bar */}
      <ShopDiscoveryBar
        searchQuery={localSearchQuery}
        onSearchChange={(query) => {
          setLocalSearchQuery(query);
          setCurrentPage(1);
        }}
        priceRange={localPriceRange}
        onPriceRangeChange={(range) => {
          setLocalPriceRange(range);
          setCurrentPage(1);
        }}
        sortBy={internalSortBy}
        onSortChange={(sort) => {
          setInternalSortBy(sort);
          setCurrentPage(1);
        }}
        itemCount={filteredProducts.length}
      />

      {/* Main Content Area */}
      <section className="container pb-20 md:pb-32">
        {/* Cinematic Grid with Enhanced Vertical Spacing */}
        <div className="min-h-[60vh] py-16 md:py-24">
          <AnimatePresence mode="wait">
            {paginatedProducts.length > 0 ? (
              <motion.div
                key={`${category}-${gender}-${tag}-${currentPage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16"
              >
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: (index % 4) * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-40 text-center"
              >
                <div className="w-16 h-px bg-gray-200 mb-8" />
                <p className="text-3xl font-serif italic text-gray-300 mb-8 tracking-tighter">
                  No pieces found in this archive selection.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimalist Pagination */}
        {totalPages > 1 && (
          <div className="mt-32 flex justify-center items-center gap-6">
            <div className="h-px w-12 md:w-24 bg-gray-100 shrink-0" />
            <div className="flex items-center gap-3">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center text-[11px] font-black transition-all duration-300 ${
                      currentPage === page
                        ? "bg-black text-white scale-110 shadow-xl shadow-black/10"
                        : "text-gray-400 hover:text-black"
                    }`}
                  >
                    {String(page).padStart(2, "0")}
                  </button>
                ),
              )}
            </div>
            <div className="h-px w-12 md:w-24 bg-gray-100 shrink-0" />
          </div>
        )}
      </section>

      {/* Cinematic Quote Footer Break */}
      <section className="bg-black py-40 text-center overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[150px] font-black text-white/5 opacity-20 pointer-events-none uppercase">
          Archive
        </div>
        <div className="container relative z-10">
          <p className="text-white text-2xl md:text-4xl font-serif italic max-w-3xl mx-auto leading-relaxed opacity-90">
            &ldquo;Style is a way to say who you are{" "}
            <br className="hidden md:block" /> without having to speak.&rdquo;
          </p>
        </div>
      </section>
    </div>
  );
}
