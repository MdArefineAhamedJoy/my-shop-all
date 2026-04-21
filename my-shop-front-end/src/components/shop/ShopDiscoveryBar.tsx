"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";

interface ShopDiscoveryBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priceRange: { min: string; max: string };
  onPriceRangeChange: (range: { min: string; max: string }) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  itemCount: number;
}

const ShopDiscoveryBar: React.FC<ShopDiscoveryBarProps> = ({
  searchQuery,
  onSearchChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortChange,
  itemCount,
}) => {
  const [isPricePopoverOpen, setIsPricePopoverOpen] = useState(false);

  const sortOptions = [
    { id: "availability", label: "Availability" },
    { id: "best-selling", label: "Best Selling" },
    { id: "newest", label: "Date, new to old" },
    { id: "oldest", label: "Date, old to new" },
    { id: "price-low", label: "Price, low to high" },
    { id: "price-high", label: "Price, high to low" },
  ];

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="container h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Enhanced Search */}
          <div className="relative group flex items-center">
            <button className="p-2 text-black hover:text-orange-600 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 shadow-xl p-2 z-40 hidden group-hover:block transition-all">
              <input
                type="text"
                placeholder="Search pieces..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-[11px] font-bold uppercase outline-hidden focus:border-black transition-colors"
              />
            </div>
          </div>

          <div className="h-5 w-px bg-gray-200" />

          {/* Size Filter Button */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 text-[11px] font-bold text-black uppercase hover:border-black transition-all">
              Size
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 shadow-xl p-4 z-40 hidden group-hover:block transition-all">
              <input
                type="text"
                placeholder="Search options"
                className="w-full bg-gray-50 border border-gray-200 rounded-sm px-3 py-2 text-[10px] font-medium outline-hidden mb-4"
              />
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {["S", "M", "L", "XL", "XXL"].map((size) => (
                  <label
                    key={size}
                    className="flex items-center gap-3 cursor-pointer group/item"
                  >
                    <div className="w-4 h-4 border border-gray-300 rounded-sm group-hover/item:border-black transition-colors" />
                    <span className="text-[11px] font-bold text-black uppercase">
                      {size} <span className="text-gray-400">(12)</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Price Filter Button */}
          <div className="relative">
            <button
              onClick={() => setIsPricePopoverOpen(!isPricePopoverOpen)}
              className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 text-[11px] font-bold text-black uppercase hover:border-black transition-all"
            >
              Price
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-300 ${isPricePopoverOpen ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <AnimatePresence>
              {isPricePopoverOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsPricePopoverOpen(false)}
                    className="fixed inset-0 z-30"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.98 }}
                    className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 shadow-2xl p-6 z-40"
                  >
                    <div className="flex flex-col gap-6 text-left">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) =>
                            onPriceRangeChange({
                              ...priceRange,
                              min: e.target.value,
                            })
                          }
                          className="w-full border border-gray-200 px-3 py-2 text-[11px] font-bold text-black focus:outline-hidden focus:border-black transition-colors"
                          placeholder="Min"
                        />
                        <span className="text-gray-300">—</span>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) =>
                            onPriceRangeChange({
                              ...priceRange,
                              max: e.target.value,
                            })
                          }
                          className="w-full border border-gray-200 px-3 py-2 text-[11px] font-bold text-black focus:outline-hidden focus:border-black transition-colors"
                          placeholder="Max"
                        />
                      </div>

                      <div className="relative h-1.5 bg-gray-100 rounded-full mx-1">
                        <motion.div
                          className="absolute h-full bg-black rounded-full"
                          style={{
                            left: `${(parseInt(priceRange.min || "0") / 200000) * 100}%`,
                            right: `${100 - (parseInt(priceRange.max || "200000") / 200000) * 100}%`,
                          }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border-2 border-white shadow-md cursor-pointer"
                          style={{
                            left: `${(parseInt(priceRange.min || "0") / 200000) * 100}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full border-2 border-white shadow-md cursor-pointer"
                          style={{
                            left: `${(parseInt(priceRange.max || "200000") / 200000) * 100}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                        {/* Interactive Range Inputs */}
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="1000"
                          value={priceRange.min || 0}
                          onChange={(e) =>
                            onPriceRangeChange({
                              ...priceRange,
                              min: e.target.value,
                            })
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-10"
                        />
                        <input
                          type="range"
                          min="0"
                          max="200000"
                          step="1000"
                          value={priceRange.max || 200000}
                          onChange={(e) =>
                            onPriceRangeChange({
                              ...priceRange,
                              max: e.target.value,
                            })
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-10"
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <span>Tk 0</span>
                        <span>Tk 200k+</span>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:block">
            {itemCount} Pieces
          </span>

          <div className="h-5 w-px bg-gray-200 hidden md:block" />

          {/* Sort Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 text-[11px] font-bold text-black uppercase hover:border-black transition-all">
              Sort by:{" "}
              {sortOptions.find((o) => o.id === sortBy)?.label || "Newest"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 shadow-xl py-2 z-40 hidden group-hover:block transition-all">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSortChange(option.id)}
                  className={`w-full text-left px-6 py-2.5 text-[11px] font-bold uppercase transition-colors ${
                    sortBy === option.id
                      ? "bg-black text-white"
                      : "text-black hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDiscoveryBar;
