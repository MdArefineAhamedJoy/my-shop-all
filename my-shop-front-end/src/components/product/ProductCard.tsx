"use client";

import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useIsMounted } from "@/hooks/useIsMounted";
import { IoCartOutline, IoHeart, IoHeartOutline } from "react-icons/io5";

import { ProductCardProps } from "@/types/card.type";

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } =
    useStore();
  const mounted = useIsMounted();

  const inWishlist = mounted ? isInWishlist(product.id) : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, product.sizes?.[0] || "M", product.colors?.[0], 1);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <Link href={`/product/${product.slug}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="group relative cursor-pointer"
      >
        {/* Creative Angled Image Container */}
        <div className="relative overflow-hidden">
          {/* Main Image with Skewed Effect */}
          <div className="relative aspect-4/5 overflow-hidden clip-path-polygon">
            <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
            <Image
              src={product.images?.[0] || "/images/placeholder.png"}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-110 group-hover:rotate-2 transition-all duration-700"
            />
          </div>

          {/* Floating Price Tag - Top Left */}
          <motion.div
            whileHover={{ rotate: -5, scale: 1.05 }}
            className="absolute -top-3 -left-3 z-20 bg-white shadow-2xl px-5 py-3 -rotate-8 group-hover:-rotate-12 transition-all duration-300"
          >
            <div className="text-xs text-gray-500 font-medium mb-0.5">
              Starting at
            </div>
            <div className="text-2xl font-bold text-orange-500">
              ৳{product.price}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-gray-400 line-through">
                ৳{product.originalPrice}
              </div>
            )}
          </motion.div>

          {/* Wishlist - Top Right Corner with Unique Shape */}
          <motion.button
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleWishlistToggle}
            className="absolute top-4 right-4 z-20 w-11 h-11 flex items-center justify-center bg-black text-white rounded-tr-2xl rounded-bl-2xl shadow-lg hover:bg-orange-500 transition-all"
          >
            {inWishlist ? <IoHeart size={20} /> : <IoHeartOutline size={20} />}
          </motion.button>

          {/* Diagonal Add to Cart Button */}
          <div className="absolute -bottom-3 -right-3 z-20">
            <motion.button
              onClick={handleAddToCart}
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-linear-to-br from-orange-500 to-orange-600 text-white px-6 py-3 flex items-center gap-2 font-bold shadow-2xl -rotate-3 hover:rotate-0 transition-all duration-300 rounded-tl-2xl rounded-br-2xl"
            >
              <IoCartOutline size={22} />
              <span className="text-sm">ADD</span>
            </motion.button>
          </div>
        </div>

        {/* Product Name - Artistic Typography */}
        <div className="mt-6 pr-12">
          <h3 className="font-bold text-lg leading-tight text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>

          {/* Decorative Line */}
          <div className="mt-2 w-12 h-0.5 bg-linear-to-r from-orange-500 to-transparent group-hover:w-20 transition-all duration-500" />
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;
