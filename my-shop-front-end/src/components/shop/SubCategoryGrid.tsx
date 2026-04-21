"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { SubCategory } from "@/types/category.type";

interface SubCategoryGridProps {
  gender: "men" | "women";
  categories: SubCategory[];
}

const SubCategoryGrid: React.FC<SubCategoryGridProps> = ({
  gender,
  categories,
}) => {
  return (
    <div className="container pt-4 pb-32 md:pb-40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="text-gray-500 font-medium tracking-[0.3em] uppercase text-xs md:text-sm">
          The Collection
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-medium mt-4 text-gray-700 tracking-tight">
          <span className="inline-block px-6 py-2 rounded-[1px] relative">
            Explore {gender === "men" ? "Men's" : "Women's"} Essentials
          </span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[300px] gap-4">
        {categories.map((category, index) => {
          // Mosaic Layout Logic
          let gridClass = "";
          switch (index % 6) {
            case 0:
              gridClass = "md:col-span-2 md:row-span-2"; // Big Square
              break;
            case 1:
              gridClass = "md:col-span-1 md:row-span-1"; // Small Square
              break;
            case 2:
              gridClass = "md:col-span-1 md:row-span-2"; // Tall Vertical
              break;
            case 3:
              gridClass = "md:col-span-1 md:row-span-1"; // Small Square
              break;
            case 4:
              gridClass = "md:col-span-2 md:row-span-1"; // Wide Horizontal
              break;
            case 5:
              gridClass = "md:col-span-2 md:row-span-1"; // Wide Horizontal
              break;
            default:
              gridClass = "md:col-span-1 md:row-span-1";
          }

          return (
            <Link
              key={category.id}
              href={`/${gender}?category=${category.slug}`}
              className={`${gridClass} group relative overflow-hidden rounded-[4px] bg-gray-100`}
            >
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="w-full h-full relative"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Modern Dark Overlay - Solid at bottom, fading up */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-80 transition-opacity duration-300" />

                {/* Full Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
                  <div className="overflow-hidden">
                    <h3 className="text-white text-xl md:text-2xl font-medium tracking-wide translate-y-0 transition-transform duration-500 group-hover:-translate-y-1">
                      {category.name}
                    </h3>
                  </div>
                  <div className="overflow-hidden mt-2">
                    <p className="text-gray-300 text-sm tracking-widest uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-75">
                      View Collection
                    </p>
                  </div>
                </div>

                {/* Minimal Arrow Icon Top Right */}
                <div className="absolute top-6 right-6 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default SubCategoryGrid;
