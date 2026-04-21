"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";

import { Collection } from "@/types/index";

const collections: Collection[] = [
  {
    id: "1",
    name: "New Arrivals",
    description: "Fresh styles just dropped",
    link: "/shop?tag=new-arrival",
    image: "/images/collection_new_arrivals_model_1769622776953.png",
  },
  {
    id: "2",
    name: "Trending Now",
    description: "What everyone is wearing",
    link: "/shop?tag=trending",
    image: "/images/collection_trending_1769622533653.png",
  },
  {
    id: "3",
    name: "Best Sellers",
    description: "Our most loved pieces",
    link: "/shop?tag=bestseller",
    image: "/images/collection_bestsellers_1769622553116.png",
  },
  {
    id: "4",
    name: "Premium Collection",
    description: "Luxury crafted essentials",
    link: "/shop",
    image: "/images/collection_premium_1769622573582.png",
  },
];

const FeaturedCollections: React.FC = () => {
  return (
    <section className="w-full">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Shop by Collection
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our curated collections designed for every occasion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <Link key={collection.id} href={collection.link || "#"}>
              <motion.div
                whileHover={{ y: -8 }}
                className="relative overflow-hidden rounded-2xl shadow-lg h-96 md:h-[500px] group cursor-pointer"
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: `url('${collection.image}')`,
                  }}
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-all duration-300" />

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-end text-white p-8 text-center pb-12">
                  <h3 className="text-3xl md:text-4xl font-bold mb-3">
                    {collection.name}
                  </h3>
                  <p className="text-base mb-6 opacity-90">
                    {collection.description}
                  </p>
                  <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-linear-to-r hover:from-orange-500 hover:to-orange-600 hover:text-white hover:scale-105 transition-all duration-300 shadow-xl">
                    Shop Now
                  </button>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollections;
