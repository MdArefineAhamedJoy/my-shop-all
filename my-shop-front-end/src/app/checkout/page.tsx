"use client";

import { useStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { IoBagOutline, IoHelpCircleOutline } from "react-icons/io5";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { cart, clearCart } = useStore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Info, 2: Payment

  const [formData, setFormData] = useState({
    contact: "",
    emailOffers: true,
    country: "Bangladesh",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    postalCode: "",
    phone: "",
    saveInfo: false,
    smsOffers: false,
    billingAddress: "same", // 'same' or 'different'
    paymentMethod: "card", // 'card', 'bkash', 'nagad', 'cod'
  });

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  const estimatedTax = cartTotal * 0.1; // 10% tax simulation
  const grandTotal = cartTotal + estimatedTax;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (checkoutStep === 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCheckoutStep(2);
      return;
    }

    setIsProcessing(true);
    // Simulate order processing
    setTimeout(() => {
      clearCart();
      setIsProcessing(false);
      toast.success("Thank you for your order! Your confirmation has been sent.");
      router.push("/");
    }, 2000);
  };

  if (cart.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
        <h2 className="text-2xl font-serif mb-6">Your bag is empty</h2>
        <button
          onClick={() => router.push("/")}
          className="bg-black text-white px-10 py-4 rounded-lg font-bold hover:bg-gray-900 transition-all uppercase tracking-widest text-xs"
        >
          Explore Collection
        </button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a]">
      {/* Checkout Header (Specialized) */}
      <header className="border-b border-gray-100 py-6 md:py-8 sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <div className="w-full px-4 md:px-12 flex items-center justify-between">
          <div className="flex-1 hidden md:block" />
          <Link
            href="/"
            className="text-3xl md:text-5xl font-black tracking-tight uppercase flex items-center"
          >
            <span className="text-black">MY</span>
            <span className="text-orange-500">SHOP</span>
          </Link>
          <div className="flex-1 flex justify-end">
            <Link href="/cart" className="relative p-2">
              <IoBagOutline size={24} />
              <span className="absolute top-0 right-0 w-4 h-4 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleCompleteOrder}
        className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)] lg:divide-x divide-gray-100"
      >
        {/* Left/Middle Column - Form Sections */}
        <div className="flex-[1.2] xl:flex-[1.5] pt-6 md:pt-10 pb-20 px-4 md:px-12 lg:px-16 xl:px-24">
          <div className="w-full">
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-10 text-[10px] font-black uppercase tracking-[0.2em]">
              <span
                className={checkoutStep === 1 ? "text-black" : "text-gray-400"}
              >
                Information
              </span>
              <span className="text-gray-300">/</span>
              <span
                className={checkoutStep === 2 ? "text-black" : "text-gray-400"}
              >
                Payment
              </span>
            </div>

            {checkoutStep === 1 ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Contact Section */}
                <section className="mb-10">
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-semibold">Contact</h2>
                    <button
                      type="button"
                      className="text-xs underline hover:text-gray-500 transition-colors"
                    >
                      Sign in
                    </button>
                  </div>
                  <input
                    type="email"
                    name="contact"
                    placeholder="Email"
                    className="w-full bg-[#f8f8f8] border border-gray-100 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 font-medium"
                    value={formData.contact}
                    onChange={handleInputChange}
                    required
                  />
                  <label className="flex items-center gap-3 mt-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="emailOffers"
                      checked={formData.emailOffers}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-gray-300 checked:bg-black accent-black"
                    />
                    <span className="text-xs font-medium text-gray-600 group-hover:text-black transition-colors">
                      Email me with news and offers
                    </span>
                  </label>
                </section>

                {/* Delivery Section */}
                <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-4">Delivery</h2>
                  <div className="space-y-4">
                    {/* Compact Country/Region UI */}
                    <div className="relative group bg-gray-50 border border-gray-200 rounded transition-all hover:border-gray-300">
                      <label className="absolute left-4 top-1.5 text-[8px] font-black uppercase tracking-widest text-gray-400 pointer-events-none">
                        Country/Region
                      </label>
                      <select
                        name="country"
                        className="w-full bg-transparent pt-4 pb-1.5 px-4 text-sm font-bold focus:ring-0 outline-none appearance-none cursor-not-allowed text-black"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled
                      >
                        <option value="Bangladesh">Bangladesh</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-0.5 pointer-events-none text-gray-400">
                        <svg
                          width="10"
                          height="6"
                          viewBox="0 0 10 6"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 1L5 5L9 1"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        className="bg-[#f8f8f8] border border-gray-100 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        className="bg-[#f8f8f8] border border-gray-100 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      className="w-full bg-[#f8f8f8] border border-gray-100 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    />
                    <input
                      type="text"
                      name="apartment"
                      placeholder="Apartment, suite, etc. (optional)"
                      className="w-full bg-[#f8f8f8] border border-gray-100 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                      value={formData.apartment}
                      onChange={handleInputChange}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        className="bg-[#f8f8f8] border border-gray-100 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                      <input
                        type="text"
                        name="postalCode"
                        placeholder="Postal code"
                        className="bg-[#f8f8f8] border border-gray-100 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="relative group">
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone"
                        className="w-full bg-[#f8f8f8] border border-gray-100 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all font-medium"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-help group-hover:text-black">
                        <IoHelpCircleOutline size={20} />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="saveInfo"
                          checked={formData.saveInfo}
                          onChange={handleInputChange}
                          className="w-4 h-4 rounded border-gray-300 checked:bg-black accent-black"
                        />
                        <span className="text-xs font-medium text-gray-600 group-hover:text-black transition-colors font-serif">
                          Save this information for next time
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="smsOffers"
                          checked={formData.smsOffers}
                          onChange={handleInputChange}
                          className="w-4 h-4 rounded border-gray-300 checked:bg-black accent-black"
                        />
                        <span className="text-xs font-medium text-gray-600 group-hover:text-black transition-colors font-serif">
                          Text me with news and offers
                        </span>
                      </label>
                    </div>
                  </div>
                </section>

                {/* Shipping Method Section */}
                <section className="mb-10">
                  <h2 className="text-xl font-semibold mb-4">
                    Shipping method
                  </h2>
                  <div className="border border-gray-200 rounded p-4 bg-gray-50/30 flex justify-between items-center group cursor-default transition-all hover:bg-white hover:shadow-sm">
                    <span className="text-sm font-medium">
                      Standard Shipping
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">
                      FREE
                    </span>
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Payment Section - Redesigned Grid */}
                <section className="mb-10">
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(1)}
                      className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tight">
                        Payment Method
                      </h2>
                      <p className="text-xs text-gray-500">
                        Select your preferred way to pay
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Stripe / Card */}
                    <div
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: "card",
                        }))
                      }
                      className={`p-6 border rounded transition-all cursor-pointer relative group ${formData.paymentMethod === "card" ? "border-black bg-gray-50" : "border-gray-100 hover:border-gray-300"}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === "card" ? "border-black" : "border-gray-300"}`}
                        >
                          {formData.paymentMethod === "card" && (
                            <div className="w-2.5 h-2.5 bg-black rounded-full" />
                          )}
                        </div>
                        <div className="flex gap-1">
                          <div className="w-8 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-[7px] font-black italic">
                            VISA
                          </div>
                          <div className="w-8 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-[7px] font-black italic">
                            MC
                          </div>
                        </div>
                      </div>
                      <h3 className="text-sm font-black uppercase italic">
                        Card Payment
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">
                        Stripe Secure
                      </p>
                    </div>

                    {/* bKash */}
                    <div
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: "bkash",
                        }))
                      }
                      className={`p-6 border rounded transition-all cursor-pointer relative group ${formData.paymentMethod === "bkash" ? "border-[#E2136E] bg-pink-50/20" : "border-gray-100 hover:border-gray-300"}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === "bkash" ? "border-[#E2136E]" : "border-gray-300"}`}
                        >
                          {formData.paymentMethod === "bkash" && (
                            <div className="w-2.5 h-2.5 bg-[#E2136E] rounded-full" />
                          )}
                        </div>
                        <span className="text-[#E2136E] text-[10px] font-black uppercase italic tracking-widest px-2 py-0.5 bg-pink-50 rounded">
                          bKash
                        </span>
                      </div>
                      <h3 className="text-sm font-black uppercase italic">
                        bKash
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">
                        Mobile Banking
                      </p>
                    </div>

                    {/* Nagad */}
                    <div
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: "nagad",
                        }))
                      }
                      className={`p-6 border rounded transition-all cursor-pointer relative group ${formData.paymentMethod === "nagad" ? "border-[#ED1C24] bg-orange-50/20" : "border-gray-100 hover:border-gray-300"}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === "nagad" ? "border-[#ED1C24]" : "border-gray-300"}`}
                        >
                          {formData.paymentMethod === "nagad" && (
                            <div className="w-2.5 h-2.5 bg-[#ED1C24] rounded-full" />
                          )}
                        </div>
                        <span className="text-[#ED1C24] text-[10px] font-black uppercase italic tracking-widest px-2 py-0.5 bg-orange-50 rounded">
                          Nagad
                        </span>
                      </div>
                      <h3 className="text-sm font-black uppercase italic">
                        Nagad
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium">
                        Mobile Banking
                      </p>
                    </div>

                    {/* COD - Full Row */}
                    <div
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: "cod",
                        }))
                      }
                      className={`md:col-span-2 p-6 border rounded transition-all cursor-pointer relative group ${formData.paymentMethod === "cod" ? "border-black bg-gray-50" : "border-gray-100 hover:border-gray-300"}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === "cod" ? "border-black" : "border-gray-300"}`}
                          >
                            {formData.paymentMethod === "cod" && (
                              <div className="w-2.5 h-2.5 bg-black rounded-full" />
                            )}
                          </div>
                          <h3 className="text-sm font-black uppercase italic tracking-wide">
                            Cash on Delivery (Full Payment)
                          </h3>
                        </div>
                        <span className="text-gray-400 text-[10px] font-black uppercase italic tracking-widest px-2 py-0.5 bg-gray-100 rounded">
                          COD
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium pl-9 leading-relaxed">
                        Pay with cash upon receiving your order at your
                        doorstep. No advance payment required.
                      </p>
                    </div>
                  </div>

                  {/* Card Specific Inputs */}
                  <AnimatePresence>
                    {formData.paymentMethod === "card" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-6 p-8 border border-gray-100 rounded bg-gray-50/50 space-y-4 max-w-2xl"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-4 bg-gray-200 rounded" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Card Details
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 relative">
                            <input
                              type="text"
                              placeholder="Card number"
                              className="w-full bg-white border border-gray-200 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-1 opacity-40">
                              <div className="w-8 h-4 bg-gray-200 rounded-sm" />
                              <div className="w-8 h-4 bg-gray-200 rounded-sm" />
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="Expiration date (MM / YY)"
                            className="bg-white border border-gray-200 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                          />
                          <input
                            type="text"
                            placeholder="Security code (CVC)"
                            className="bg-white border border-gray-200 rounded py-2 px-5 text-sm focus:ring-1 focus:ring-black outline-none transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Billing Address Selection */}
                <section className="mb-10">
                  <h2 className="text-lg font-black uppercase italic mb-4">
                    Billing address
                  </h2>
                  <div className="border border-gray-200 rounded overflow-hidden divide-y divide-gray-100">
                    <label
                      className={`flex items-center gap-4 p-3 cursor-pointer transition-all ${formData.billingAddress === "same" ? "bg-black text-white" : "hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name="billingAddress"
                        value="same"
                        checked={formData.billingAddress === "same"}
                        onChange={handleInputChange}
                        className="w-5 h-5 accent-orange-500"
                      />
                      <span className="text-sm font-bold uppercase tracking-tight">
                        Same as shipping address
                      </span>
                    </label>
                    <label
                      className={`flex items-center gap-4 p-3 cursor-pointer transition-all ${formData.billingAddress === "different" ? "bg-black text-white" : "hover:bg-gray-50"}`}
                    >
                      <input
                        type="radio"
                        name="billingAddress"
                        value="different"
                        checked={formData.billingAddress === "different"}
                        onChange={handleInputChange}
                        className="w-5 h-5 accent-orange-500"
                      />
                      <span className="text-sm font-bold uppercase tracking-tight">
                        Use a different billing address
                      </span>
                    </label>
                  </div>
                </section>
              </motion.div>
            )}

            {/* Submit Button - Flat Standard Flow */}
            <div className="mt-8 mb-6">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-orange-500 text-black py-3 rounded font-black uppercase tracking-[0.3em] text-[10px] md:text-xs hover:bg-orange-600 transition-all disabled:opacity-70 disabled:cursor-wait active:scale-[0.98] border border-orange-600 shadow-lg shadow-orange-500/20"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce" />
                  </span>
                ) : checkoutStep === 1 ? (
                  "Proceed to Secure Payment"
                ) : (
                  "Finalize & Confirm Order"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary Sidebar */}
        <aside className="flex-1 bg-white lg:bg-[#fafafa] border-t lg:border-t-0 py-10 md:py-16 px-4 md:px-12 lg:px-16 xl:px-24">
          <div className="w-full">
            <h2 className="text-xl font-black uppercase italic mb-8 hidden lg:block tracking-tight text-gray-400">
              Order Summary
            </h2>
            <div className="space-y-6">
              {cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}`}
                  className="flex items-center gap-4"
                >
                  <div className="relative">
                    <div className="w-16 h-20 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center">
                      <Image
                        src={
                          item.product.images?.[0] || "/images/placeholder.png"
                        }
                        alt={item.product.name}
                        width={64}
                        height={80}
                        className="object-cover"
                      />
                    </div>
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-black/80 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-[#1a1a1a] leading-tight truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-medium tracking-tight mt-0.5">
                      {item.selectedColor || "N/A"} / {item.selectedSize}
                    </p>
                  </div>
                  <div className="text-[13px] font-medium text-[#1a1a1a]">
                    ৳{item.product.price.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="font-bold">৳{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-1.5 group cursor-help">
                  <span className="text-gray-600 font-medium">Shipping</span>
                  <IoHelpCircleOutline
                    size={16}
                    className="text-gray-300 group-hover:text-black transition-colors"
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  FREE
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-1.5 group cursor-help">
                  <span className="text-gray-600 font-medium font-serif">
                    Estimated taxes
                  </span>
                  <IoHelpCircleOutline
                    size={16}
                    className="text-gray-300 group-hover:text-black transition-colors"
                  />
                </div>
                <span className="font-bold">
                  ৳{estimatedTax.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-baseline">
              <span className="text-xl font-bold">Total</span>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase mr-2 tracking-widest align-middle">
                  BDT
                </span>
                <span className="text-2xl font-black align-middle tracking-tighter">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </form>

      {/* Compact Global Checkout Footer - Target Height h-20 */}
      <footer className="w-full bg-white border-t border-gray-100 py-4">
        <div className="w-full px-4 md:px-12 lg:px-24 flex flex-col items-center text-center">
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-3">
            {[
              "Refund policy",
              "Shipping",
              "Privacy policy",
              "Terms of service",
              "Contact",
            ].map((link) => (
              <Link
                key={link}
                href={`/${link.toLowerCase().replace(/ /g, "-")}`}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-all"
              >
                {link}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-gray-100 w-full max-w-xs flex flex-col items-center uppercase tracking-widest text-[8px] font-black">
            <p className="text-black mb-1">© 2026 MY SHOP.</p>
            <p className="text-gray-400">All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
