"use client";

import { useStore } from "@/lib/store";
import { WishlistItem } from "@/types/wishlist.type";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useIsMounted } from "@/hooks/useIsMounted";
import {
  IoBagOutline,
  IoCloseOutline,
  IoHeart,
  IoHeartOutline,
  IoTrashOutline,
} from "react-icons/io5";

const WishlistModal: React.FC = () => {
  const {
    wishlist,
    isWishlistOpen,
    setWishlistOpen,
    setMiniCartOpen,
    removeFromWishlist,
    addToCart,
  } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isWishlistOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      const header = document.querySelector("header");
      if (header) {
        header.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
      document.body.style.paddingRight = "0px";

      const header = document.querySelector("header");
      if (header) {
        header.style.paddingRight = "0px";
      }
    }
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
      const header = document.querySelector("header");
      if (header) {
        header.style.paddingRight = "0px";
      }
    };
  }, [isWishlistOpen]);

  const mounted = useIsMounted();

  if (!mounted || pathname === "/checkout") return null;

  const handleBuyNow = (item: WishlistItem) => {
    // Add to cart with default size/color
    addToCart(
      item.product,
      item.product.sizes?.[0] || "M",
      item.product.colors?.[0],
      1,
    );
    setWishlistOpen(false);
    setMiniCartOpen(false);
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWishlistOpen(false)}
            className="fixed inset-0 bg-black/5 z-100"
          />

          {/* Side Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md lg:max-w-sm bg-white shadow-[-10px_0_50px_rgba(0,0,0,0.1)] z-101 flex flex-col rounded-l-2xl border-l border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -5 }}
                  className="relative w-10 h-10 flex items-center justify-center bg-black text-orange-500 rounded-tr-2xl rounded-bl-2xl shadow-lg"
                >
                  <IoHeart size={20} />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"
                  />
                </motion.div>

                <div className="flex flex-col -space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-gray-950 uppercase italic">
                    Wishlist
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Collection
                    </span>
                    <span className="w-1 h-1 bg-orange-500 rounded-full" />
                    <span className="text-[10px] font-black text-orange-600 uppercase ">
                      {wishlist.length}{" "}
                      {wishlist.length === 1 ? "Piece" : "Pieces"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setWishlistOpen(false)}
                className="group relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-full border border-gray-100 scale-100 group-hover:scale-110 group-hover:border-red-100 transition-all cursor-pointer" />
                <IoCloseOutline
                  className="text-gray-400 group-hover:text-red-500 transition-colors cursor-pointer"
                  size={24}
                />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 relative"
                  >
                    <IoHeartOutline size={36} className="text-orange-200" />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-sm"
                    >
                      <IoBagOutline size={16} className="text-orange-500" />
                    </motion.div>
                  </motion.div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Your Wishlist is Empty
                  </h3>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-[240px] mb-8">
                    Discover our unique collection and save your favorite items
                    for later.
                  </p>
                  <button
                    onClick={() => {
                      setWishlistOpen(false);
                      router.push("/shop");
                    }}
                    className="px-8 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                  >
                    Start Exploring
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {wishlist.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative flex gap-4 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-500"
                    >
                      {/* Modern Image Display */}
                      <div
                        className="relative w-20 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0 cursor-pointer ring-1 ring-gray-100 group-hover:ring-orange-200 transition-all duration-500"
                        onClick={() => {
                          setWishlistOpen(false);
                          router.push(`/product/${item.product.slug}`);
                        }}
                      >
                        <Image
                          src={
                            item.product.images?.[0] ||
                            "/images/placeholder.png"
                          }
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        />
                      </div>

                      {/* Refined Content Area - Tightened No Gaps */}
                      <div className="flex-1 flex flex-col min-w-0 py-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[12px] font-black text-orange-500 uppercase tracking-[0.2em]">
                            {item.product.category}
                          </span>
                          <button
                            onClick={() => removeFromWishlist(item.product.id)}
                            className="text-red-500 rounded-full transition-all duration-300 cursor-pointer"
                            title="Remove Piece"
                          >
                            <IoTrashOutline size={20} />
                          </button>
                        </div>

                        <h4
                          className="font-bold text-base text-gray-950 line-clamp-1 leading-none mt-1 group-hover:text-orange-600 transition-colors cursor-pointer"
                          onClick={() => {
                            setWishlistOpen(false);
                            router.push(`/product/${item.product.slug}`);
                          }}
                        >
                          {item.product.name}
                        </h4>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex flex-col -space-y-1">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                              Current Price
                            </span>
                            <span className="text-lg font-black text-gray-950 tracking-tight">
                              ৳{item.product.price.toLocaleString()}
                            </span>
                          </div>

                          <button
                            onClick={() => handleBuyNow(item)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-black text-orange-500 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-orange-600 hover:text-white shadow-lg transition-all active:scale-95 cursor-pointer"
                          >
                            <IoBagOutline size={14} />
                            <span>Buy Now</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {wishlist.length > 0 && (
              <div className="p-6 py-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    setWishlistOpen(false);
                    router.push("/shop");
                  }}
                  className="w-full py-3 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WishlistModal;
