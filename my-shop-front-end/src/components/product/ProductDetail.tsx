"use client";

import { useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useIsMounted } from "@/hooks/useIsMounted";
import {
  IoAdd,
  IoChevronBack,
  IoChevronForward,
  IoClose,
  IoPlayOutline,
  IoRemove,
  IoStar,
} from "react-icons/io5";

import { ProductDetailProps } from "@/types/detail.type";

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const allMedia = [
    ...product.images.map((img) => ({ type: "image" as const, url: img })),
    ...(product.video ? [{ type: "video" as const, url: product.video }] : []),
  ];

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const {
    addToCart,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    setMiniCartOpen,
  } = useStore();
  const router = useRouter();
  const mounted = useIsMounted();
  const inWishlist = mounted ? isInWishlist(product.id) : false;

  const handleAddToCart = async () => {
    if (!(await addToCart(product, selectedSize, selectedColor, quantity)))
      return;
    setMiniCartOpen(false);
    router.push("/cart");
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="container py-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-12 lg:gap-16 items-start">
          {/* Image Gallery */}
          <div className="flex flex-col md:flex-row gap-4 lg:sticky lg:top-32 h-fit">
            {/* Vertical Thumbnails */}
            <div className="hidden md:flex flex-col gap-3 w-20 shrink-0">
              {allMedia.map((media, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMediaIndex(index)}
                  className={`relative aspect-4/5 w-full overflow-hidden border-2 transition-all duration-200 ${
                    selectedMediaIndex === index
                      ? "border-[#1c1c1c] shadow-sm"
                      : "border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-300"
                  }`}
                >
                  {media.type === "image" ? (
                    <Image
                      src={media.url}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <IoPlayOutline size={24} className="text-[#1c1c1c]" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1">
              <div
                className="relative aspect-4/5 overflow-hidden bg-[#fafafa] border border-gray-200 shadow-sm cursor-zoom-in group"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setZoomPos({ x, y });
                }}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={() => setIsModalOpen(true)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedMediaIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="w-full h-full"
                  >
                    {allMedia[selectedMediaIndex]?.type === "image" ? (
                      <motion.div
                        animate={{
                          scale: isHovering ? 2.5 : 1,
                          originX: `${zoomPos.x}%`,
                          originY: `${zoomPos.y}%`,
                        }}
                        transition={{
                          type: "tween",
                          ease: "easeOut",
                          duration: 0.2,
                        }}
                        className="w-full h-full relative"
                      >
                        <Image
                          src={allMedia[selectedMediaIndex].url}
                          alt={product.name}
                          fill
                          priority
                          className="object-cover"
                        />
                      </motion.div>
                    ) : (
                      <video
                        src={allMedia[selectedMediaIndex].url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMediaIndex((prev) =>
                        prev === 0 ? allMedia.length - 1 : prev - 1,
                      );
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-white/95 backdrop-blur-sm border border-gray-200 text-black hover:bg-black hover:text-white transition-all duration-200 shadow-sm pointer-events-auto"
                  >
                    <IoChevronBack size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMediaIndex((prev) =>
                        prev === allMedia.length - 1 ? 0 : prev + 1,
                      );
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-white/95 backdrop-blur-sm border border-gray-200 text-black hover:bg-black hover:text-white transition-all duration-200 shadow-sm pointer-events-auto"
                  >
                    <IoChevronForward size={18} />
                  </button>
                </div>

                {/* Media Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full">
                  {selectedMediaIndex + 1} / {allMedia.length}
                </div>

                {/* Video Indicator */}
                {allMedia[selectedMediaIndex]?.type === "video" && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[#1c1c1c] p-2 rounded-full shadow-sm">
                    <IoPlayOutline size={16} />
                  </div>
                )}
              </div>

              {/* Mobile Thumbnails */}
              <div className="flex md:hidden gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {allMedia.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMediaIndex(index)}
                    className={`relative w-16 aspect-4/5 flex-shrink-0 overflow-hidden border-2 transition-all duration-200 ${
                      selectedMediaIndex === index
                        ? "border-[#1c1c1c]"
                        : "border-gray-200 opacity-60"
                    }`}
                  >
                    {media.type === "image" ? (
                      <Image
                        src={media.url}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <IoPlayOutline size={18} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col lg:pt-0">
            {/* Product Title */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-serif italic font-medium text-[#1c1c1c] leading-none mb-3">
              {product.name}
            </h1>

            {/* Rating and Price in one row */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex text-[#1c1c1c] gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IoStar
                      key={i}
                      size={16}
                      className={
                        i < Math.floor(product.rating || 0)
                          ? "fill-current text-amber-500"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  ({product.reviewCount || 0})
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-xl md:text-2xl font-semibold text-[#1c1c1c]">
                  Tk {product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    Tk {product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Selection Options */}
            <div className="flex flex-col gap-5">
              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                    Color:{" "}
                    <span className="font-normal capitalize text-gray-600">
                      {selectedColor}
                    </span>
                  </span>
                  <div className="flex gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-9 h-9 rounded-full border-2 p-0.5 transition-all duration-200 ${
                          selectedColor === color
                            ? "border-[#1c1c1c] scale-110"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div
                          className="w-full h-full rounded-full"
                          style={{ backgroundColor: color.toLowerCase() }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                    Size:{" "}
                    <span className="font-normal uppercase text-gray-600">
                      {selectedSize}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-9 px-3 flex items-center justify-center border text-xs font-semibold transition-all duration-200 ${
                          selectedSize === size
                            ? "bg-[#1c1c1c] text-white border-[#1c1c1c]"
                            : "bg-white text-[#1c1c1c] border-gray-300 hover:border-[#1c1c1c]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                  Quantity
                </span>
                <div className="flex items-center border border-gray-300 w-fit">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-[#1c1c1c]"
                  >
                    <IoRemove size={16} />
                  </button>
                  <span className="w-10 text-center font-bold text-[#1c1c1c] text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-[#1c1c1c]"
                  >
                    <IoAdd size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 mt-8">
              <button
                disabled={!mounted}
                onClick={handleAddToCart}
                className="w-full bg-[#1c1c1c] text-white py-3.5 text-xs font-semibold uppercase tracking-wide hover:bg-[#2d2d2d] transition-all duration-200"
              >
                Add to Cart
              </button>

              <button
                onClick={handleWishlistToggle}
                className={`w-full py-3.5 text-xs font-semibold uppercase tracking-wide border transition-all duration-200 ${
                  inWishlist
                    ? "bg-gray-50 border-[#1c1c1c] text-[#1c1c1c]"
                    : "border-gray-300 text-gray-600 hover:border-[#1c1c1c] hover:text-[#1c1c1c]"
                }`}
              >
                {inWishlist ? "★ Saved" : "Add to Wishlist"}
              </button>
            </div>

            {/* Extra Info - Compact Cards */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 border border-gray-200">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                    SKU
                  </span>
                  <p className="text-xs font-medium text-[#1c1c1c]">
                    {product.sku}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 border border-gray-200">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                    Stock
                  </span>
                  <p className="text-xs font-medium text-[#1c1c1c]">
                    {product.stock > 0
                      ? `${product.stock} units`
                      : "Out of stock"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 border border-gray-200">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                    Category
                  </span>
                  <p className="text-xs font-medium text-[#1c1c1c] capitalize">
                    {product.category}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 border border-gray-200">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 block mb-1">
                    Collection
                  </span>
                  <p className="text-xs font-medium text-[#1c1c1c] capitalize">
                    {product.gender}&apos;s Editorial
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Lightbox Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-white flex items-center justify-center p-4 md:p-12"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center text-[#1c1c1c] hover:bg-gray-100 rounded-full transition-colors"
            >
              <IoClose size={32} />
            </button>

            <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedMediaIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full h-full relative"
                >
                  {allMedia[selectedMediaIndex].type === "image" ? (
                    <Image
                      src={allMedia[selectedMediaIndex].url}
                      alt={product.name}
                      fill
                      className="object-contain"
                      priority
                    />
                  ) : (
                    <video
                      src={allMedia[selectedMediaIndex].url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Modal Navigation */}
              {allMedia.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedMediaIndex((prev) =>
                        prev === 0 ? allMedia.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center text-[#1c1c1c] hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <IoChevronBack size={32} />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedMediaIndex((prev) =>
                        prev === allMedia.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center text-[#1c1c1c] hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <IoChevronForward size={32} />
                  </button>
                </>
              )}
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 overflow-x-auto max-w-[80vw] scrollbar-hide px-4">
              {allMedia.map((media, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMediaIndex(index)}
                  className={`relative w-16 aspect-4/5 shrink-0 border-2 transition-all ${
                    selectedMediaIndex === index
                      ? "border-[#1c1c1c]"
                      : "border-transparent opacity-40"
                  }`}
                >
                  {media.type === "image" ? (
                    <Image
                      src={media.url}
                      alt="thumbnail"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <IoPlayOutline size={20} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;
