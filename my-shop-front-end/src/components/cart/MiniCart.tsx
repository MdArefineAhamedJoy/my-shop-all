"use client";

import { useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

import {
  IoAddOutline,
  IoClose,
  IoRemoveOutline,
  IoTrashOutline,
} from "react-icons/io5";

const MiniCart: React.FC = () => {
  const {
    cart,
    isMiniCartOpen,
    setMiniCartOpen,
    updateCartQuantity,
    removeFromCart,
  } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  useEffect(() => {
    if (isMiniCartOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // Apply instantly to prevent shaking
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
  }, [isMiniCartOpen]);

  const handleQuantityChange = (
    productId: string,
    size: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;
    updateCartQuantity(productId, size, newQuantity);
  };

  if (pathname === "/checkout") return null;

  return (
    <AnimatePresence>
      {isMiniCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMiniCartOpen(false)}
            className="fixed inset-0 z-50 cursor-default bg-black/5"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              duration: 0.4,
            }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-md lg:max-w-sm bg-white z-50 shadow-[-10px_0_50px_rgba(0,0,0,0.1)] flex flex-col rounded-l-2xl border-l border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -5 }}
                  className="relative w-10 h-10 flex items-center justify-center bg-black text-orange-500 rounded-tr-2xl rounded-bl-2xl shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"
                  />
                </motion.div>

                <div className="flex flex-col -space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-gray-950 uppercase italic">
                    Shopping Bag
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Inventory
                    </span>
                    <span className="w-1 h-1 bg-orange-500 rounded-full" />
                    <span className="text-[10px] font-black text-orange-600 uppercase">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      {cart.reduce((sum, item) => sum + item.quantity, 0) === 1
                        ? "Item"
                        : "Items"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMiniCartOpen(false)}
                className="group relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-full border border-gray-100 scale-100 group-hover:scale-110 group-hover:border-red-100 transition-all cursor-pointer" />
                <IoClose
                  className="text-gray-400 group-hover:text-red-500 transition-colors cursor-pointer"
                  size={24}
                />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 relative"
                  >
                    <svg
                      className="w-10 h-10 text-orange-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 bg-white p-1 rounded-full shadow-sm"
                    >
                      <IoAddOutline size={16} className="text-orange-500" />
                    </motion.div>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Your Bag is Empty
                  </h3>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-[240px] mb-8">
                    Your shopping bag is waiting for its first item. Start
                    exploring our latest arrivals.
                  </p>
                  <button
                    onClick={() => setMiniCartOpen(false)}
                    className="px-8 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                  >
                    Shop Collection
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <motion.div
                      key={`${item.product.id}-${item.selectedSize}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group flex gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {/* Left: Product Image */}
                      <div
                        className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-50 shrink-0 cursor-pointer ring-1 ring-gray-100 group-hover:ring-orange-200 transition-all duration-500"
                        onClick={() => {
                          setMiniCartOpen(false);
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

                      {/* Right: Info Area (Image inspired structure) */}
                      <div className="flex-1 min-w-0 flex flex-col py-0.5">
                        {/* Top Line: Title & Price */}
                        <div className="flex justify-between items-start gap-2">
                          <h4
                            className="font-black text-sm text-gray-950 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors cursor-pointer"
                            onClick={() => {
                              setMiniCartOpen(false);
                              router.push(`/product/${item.product.slug}`);
                            }}
                          >
                            {item.product.name}
                          </h4>
                          <span className="font-black text-sm whitespace-nowrap text-orange-500">
                            ৳{item.product.price.toLocaleString()}
                          </span>
                        </div>

                        {/* Middle: Description/Details */}
                        <div className="mt-1.5 flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {item.product.category}
                          </span>
                          <span className="text-[10px] font-black text-gray-500 uppercase">
                            Size :{" "}
                            <span className="text-orange-500">
                              {item.selectedSize}
                            </span>
                          </span>
                        </div>

                        {/* Bottom: Actions */}
                        <div className="flex items-center justify-between mt-auto pt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center bg-gray-100 rounded-md border border-gray-200 p-0.5">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.product.id,
                                  item.selectedSize,
                                  item.quantity - 1,
                                )
                              }
                              className="w-6 h-6 flex items-center justify-center hover:bg-white hover:text-orange-600 hover:shadow-sm rounded transition-all text-orange-600 cursor-pointer"
                              disabled={item.quantity <= 1}
                            >
                              <IoRemoveOutline size={12} />
                            </button>
                            <span className="w-6 text-center text-[11px] font-black text-gray-950">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.product.id,
                                  item.selectedSize,
                                  item.quantity + 1,
                                )
                              }
                              className="w-6 h-6 flex items-center justify-center hover:bg-white hover:text-orange-600 hover:shadow-sm rounded transition-all text-orange-600 cursor-pointer"
                            >
                              <IoAddOutline size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              removeFromCart(item.product.id, item.selectedSize)
                            }
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-md text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                          >
                            <IoTrashOutline size={12} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Perfectly Compact */}
            {cart.length > 0 && (
              <div className="bg-white border-t border-gray-100 p-4 pt-3 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-bold text-[9px] uppercase tracking-widest">
                      Subtotal
                    </span>
                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                    <p className="text-[9px] text-gray-400 font-medium uppercase tracking-tight">
                      Tax Excl.
                    </p>
                  </div>
                  <span className="text-2xl font-black text-gray-950 tracking-tighter">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href="/cart"
                    onClick={() => setMiniCartOpen(false)}
                    className="w-full"
                  >
                    <button className="w-full h-11 bg-black text-orange-500 border border-black hover:bg-orange-600 hover:text-white hover:border-orange-600 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 shadow-xl shadow-black/5 active:scale-[0.98] cursor-pointer">
                      Checkout Bag
                    </button>
                  </Link>
                  <button
                    onClick={() => setMiniCartOpen(false)}
                    className="w-full py-1 text-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-all cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MiniCart;
