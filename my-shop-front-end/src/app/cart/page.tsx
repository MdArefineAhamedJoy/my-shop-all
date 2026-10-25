"use client";

import { useCatalog } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useIsMounted } from "@/hooks/useIsMounted";
import {
  IoAddOutline,
  IoCloseOutline,
  IoRemoveOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";

// Swiper imports
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const CartPage: React.FC = () => {
  const { cart, updateCartQuantity, removeFromCart } = useStore();
  const router = useRouter();
  const mounted = useIsMounted();

  const { products } = useCatalog();
  const recommendations = products
    .filter((p) => !cart.some((i) => i.product.id === p.id) && p.images.length)
    .slice(0, 12)
    .map((p) => ({ ...p, image: p.images[0] }));

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const total = subtotal; // Adjusting if shipping/taxes are added later

  const handleQuantityChange = (
    productId: string,
    size: string,
    newQuantity: number,
    color?: string,
  ) => {
    if (newQuantity < 1) return;
    updateCartQuantity(productId, size, newQuantity, color);
  };

  if (!mounted) return null;

  if (cart.length === 0) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-white"
        style={{ paddingTop: "var(--header-height, 80px)" }}
      >
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-8 uppercase tracking-widest text-[#1c1c1c]">
            Your Cart
          </h1>
          <p className="text-gray-500 mb-10 text-sm">
            Your shopping cart is empty.
          </p>
          <button
            onClick={() => router.push("/shop")}
            className="px-10 py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="bg-white min-h-screen font-sans"
      style={{ paddingTop: "var(--header-height, 80px)" }}
    >
      <div className="container py-12 md:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <h1 className="text-3xl md:text-3xl font-bold text-center mb-16 uppercase tracking-widest text-[#1c1c1c]">
            your cart
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Cart Table Section */}
            <div className="lg:col-span-8">
              {/* Product Table Header */}
              <div className="hidden md:grid grid-cols-12 bg-[#f9f9f9] border border-[#eeeeee] p-4 text-[11px] font-bold uppercase tracking-widest text-[#1c1c1c]">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Cart Items */}
              <div className="flex flex-col border-x border-[#f1f1f1]">
                <AnimatePresence mode="popLayout">
                  {cart.map((item) => (
                    <motion.div
                      key={`${item.product.id}-${item.selectedSize}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 border-b border-[#f1f1f1] group"
                    >
                      {/* Product Column */}
                      <div className="col-span-1 md:col-span-6 flex gap-6 items-center">
                        <div className="relative w-24 h-32 bg-[#f9f9f9] shrink-0">
                          <Image
                            src={
                              item.product.images?.[0] ||
                              "/images/placeholder.png"
                            }
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/product/${item.product.slug}`}
                            className="text-[14px] font-bold text-[#1c1c1c] hover:underline"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-[12px] text-gray-500 uppercase tracking-tight">
                            {item.product.category || "General"}
                          </p>
                          <div className="flex gap-2 text-[11px] text-gray-400 font-medium uppercase mt-2">
                            <span>{item.selectedColor}</span>
                            <span>/</span>
                            <span>{item.selectedSize}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price Column */}
                      <div className="col-span-1 md:col-span-2 text-center">
                        <span className="md:hidden text-[10px] uppercase font-bold text-gray-400 block mb-1">
                          Price
                        </span>
                        <span className="text-[14px] font-medium text-[#1c1c1c]">
                          Tk {item.product.price.toLocaleString()}.00
                        </span>
                      </div>

                      {/* Quantity Column */}
                      <div className="col-span-1 md:col-span-2 flex justify-center">
                        <div className="flex items-center border border-[#eeeeee] bg-white">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product.id,
                                item.selectedSize,
                                item.quantity - 1,
                                item.selectedColor,
                              )
                            }
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-colors"
                          >
                            <IoRemoveOutline size={16} />
                          </button>
                          <span className="w-10 text-center text-sm font-bold text-[#1c1c1c]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product.id,
                                item.selectedSize,
                                item.quantity + 1,
                                item.selectedColor,
                              )
                            }
                            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-colors"
                          >
                            <IoAddOutline size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Total Column */}
                      <div className="col-span-1 md:col-span-2 text-right flex items-center justify-between md:justify-end gap-4">
                        <div className="md:hidden">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1 text-left">
                            Total
                          </span>
                          <span className="text-[14px] font-bold text-[#1c1c1c]">
                            Tk{" "}
                            {(
                              item.product.price * item.quantity
                            ).toLocaleString()}
                            .00
                          </span>
                        </div>
                        <span className="hidden md:block text-[14px] font-bold text-[#1c1c1c]">
                          Tk{" "}
                          {(
                            item.product.price * item.quantity
                          ).toLocaleString()}
                          .00
                        </span>
                        <button
                          onClick={() =>
                            removeFromCart(
                              item.product.id,
                              item.selectedSize,
                              item.selectedColor,
                            )
                          }
                          className="text-gray-400 hover:text-black transition-colors"
                        >
                          <IoCloseOutline size={22} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Bottom Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                <div className="flex flex-col gap-4">
                  <label className="text-[12px] font-bold uppercase tracking-widest text-[#1c1c1c]">
                    Additional Comments
                  </label>
                  <textarea
                    placeholder="Special instruction for seller..."
                    className="w-full h-32 p-4 border border-[#eeeeee] text-[13px] bg-[#fdfdfd] focus:outline-none focus:border-gray-300 resize-none transition-colors"
                  />
                  <div className="flex items-center gap-2 text-gray-400 text-[11px] font-medium tracking-wide">
                    <IoShieldCheckmarkOutline size={16} />
                    Secure Shopping Guarantee
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Section */}
            <div className="lg:col-span-4">
              <div className="bg-white p-2">
                <div className="border border-[#eeeeee] p-8">
                  <h2 className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#1c1c1c] mb-8 pb-4 border-b-2 border-black inline-block">
                    Order Summary
                  </h2>

                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-bold text-[#1c1c1c]">
                        Subtotal
                      </span>
                      <span className="text-[16px] font-bold text-[#1c1c1c]">
                        Tk {subtotal.toLocaleString()}.00
                      </span>
                    </div>

                    <div className="w-full h-px bg-[#eeeeee]" />

                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-extrabold uppercase tracking-widest text-[#1c1c1c]">
                        Total:
                      </span>
                      <span className="text-[18px] font-black text-[#1c1c1c]">
                        Tk {total.toLocaleString()}.00
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 mb-8 leading-relaxed">
                    Tax included and shipping calculated at checkout
                  </p>

                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => router.push("/checkout")}
                      className="w-full bg-[#1c1c1c] text-white py-4 text-[12px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors"
                    >
                      Proceed to Checkout
                    </button>

                    <button
                      onClick={() => router.push("/shop")}
                      className="w-full bg-white text-[#1c1c1c] py-4 text-[12px] font-black uppercase tracking-[0.2em] border border-[#1c1c1c] hover:bg-gray-50 transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* You May Also Like Section */}
          <section className="mt-32 pt-20 pb-40 border-t border-[#eeeeee]">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-16 uppercase tracking-[0.3em] text-[#1c1c1c] font-serif">
              you may also like
            </h2>

            <div className="px-4">
              <Swiper
                modules={[Autoplay]}
                loop={true}
                autoplay={{
                  delay: 4500,
                  disableOnInteraction: false,
                }}
                spaceBetween={30}
                slidesPerView={2}
                breakpoints={{
                  640: { slidesPerView: 3 },
                  1024: { slidesPerView: 4 },
                  1280: { slidesPerView: 5 },
                }}
                className="recommendation-swiper"
              >
                {recommendations.map((item) => (
                  <SwiperSlide key={item.id}>
                    <Link
                      href={`/product/${item.slug}`}
                      className="flex flex-col gap-6 group"
                    >
                      <div className="relative aspect-3/4 bg-[#fafafa] overflow-hidden">
                        {/* Status Badge - Moda Style */}
                        <div className="absolute top-0 right-0 z-20 bg-[#1c1c1c] text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-[0.2em] leading-none">
                          Sold Out
                        </div>

                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                        />

                        {/* Elegant overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
                      </div>

                      <div className="text-center space-y-2">
                        <div className="px-2">
                          <h4 className="text-[14px] md:text-[15px] font-serif italic text-[#1c1c1c] line-clamp-1 group-hover:text-gray-500 transition-colors">
                            {item.name}
                          </h4>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-[12px] font-bold uppercase tracking-widest text-[#1c1c1c]">
                            Tk {item.price.toLocaleString()}.00
                          </p>
                          <div className="w-10 h-px bg-gray-200 mx-auto group-hover:w-16 transition-all duration-500" />
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
