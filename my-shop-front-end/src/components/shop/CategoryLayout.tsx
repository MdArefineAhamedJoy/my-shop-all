"use client";

import ProductCard from "@/components/product/ProductCard";
import { motion } from "framer-motion";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import ShopDiscoveryBar from "@/components/shop/ShopDiscoveryBar";
import { CategoryLayoutProps } from "@/types/category.type";

const ITEMS_PER_PAGE = 16;

const CategoryLayout: React.FC<CategoryLayoutProps> = ({
  gender,
  categoryName,
  products,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [internalSortBy, setInternalSortBy] = useState<string>("newest");
  const [localPriceRange, setLocalPriceRange] = useState({ min: "", max: "" });

  // Combined Filtering Logic
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (localSearchQuery) {
      const q = localSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

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
        break;
    }

    return filtered;
  }, [products, localSearchQuery, internalSortBy, localPriceRange]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="container pt-2 pb-8">
        {/* Header Section - Refined & Minimalist (Reduced Height feel) */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 mb-4">
            <Link
              href={`/${gender}`}
              className="hover:text-black transition-colors"
            >
              Back to {gender === "men" ? "Men" : "Women"}
            </Link>
            <span className="text-gray-200">/</span>
            <span className="text-black">{categoryName}</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-serif font-medium text-black tracking-tighter leading-none mb-4 capitalize">
            {categoryName}
            <span className="text-orange-600">.</span>
          </h2>
          <div className="h-px w-12 bg-black mx-auto" />
        </div>

        {/* Reusable Shop Discovery Bar - Unified & High Visibility */}
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

        {/* Product Grid with Enhanced Vertical Spacing */}
        <main className="py-16 md:py-24">
          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {displayedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-16 flex justify-center items-center gap-4">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
                  >
                    <IoChevronBack size={20} />
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all ${
                            currentPage === page
                              ? "bg-orange-600 text-white shadow-lg"
                              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
                  >
                    <IoChevronForward size={20} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-400 italic text-lg">
                No products found in this category.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryLayout;
