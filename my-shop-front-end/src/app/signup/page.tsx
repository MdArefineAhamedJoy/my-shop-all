"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { IoEye, IoEyeOff, IoSparklesOutline } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen h-dvh bg-white flex flex-col lg:flex-row-reverse overflow-hidden">

      {/* ══════════════════════════════
          Visual Side — Desktop only
      ══════════════════════════════ */}
      <div className="hidden lg:block lg:w-[48%] flex-shrink-0 relative bg-[#111]">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop&crop=top"
          alt="Fashion Editorial"
          fill
          priority
          sizes="48vw"
          className="object-cover object-top opacity-50 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute bottom-0 left-0 right-0 p-12 text-white z-10 text-right"
        >
          <span className="text-xs font-bold uppercase tracking-[0.45em] text-orange-500 block mb-4">
            Join The Circle
          </span>
          <h1 className="text-5xl font-black italic leading-[1.1] mb-4">
            A new era of<br />personal style.
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed ml-auto max-w-xs">
            Save your favorite pieces, get personalized recommendations, and enjoy early access to exclusive drops.
          </p>
          <div className="flex items-center justify-end gap-3 mt-8">
            <span className="text-[10px] tracking-[0.4em] text-white/40 uppercase font-bold">Privacy First</span>
            <div className="w-10 h-px bg-white/30" />
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════
          Form Side
      ══════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-white">

        {/* Mobile Hero */}
        <div className="lg:hidden relative h-48 w-full flex-shrink-0 bg-[#111]">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop&crop=top"
            alt="Fashion Editorial"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-50 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
          <div className="absolute top-4 left-4 z-10">
            <span className="text-xl font-black text-white">MY<span className="text-orange-500">SHOP</span></span>
          </div>
        </div>

        {/* Back Button */}
        <Link
          href="/"
          className="self-start mx-5 mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors group"
        >
          <span className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-base group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
            ←
          </span>
          <span className="hidden sm:inline">Back to Home</span>
        </Link>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-6">
          <div className="w-full max-w-[420px]">

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-7"
            >
              <div className="hidden lg:flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-orange-500" />
                <span className="text-xl font-black">MY<span className="text-orange-500">SHOP</span></span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <IoSparklesOutline className="text-orange-500" size={16} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-500">
                  Exclusive Access
                </span>
              </div>
              <h2 className="text-3xl font-black text-[#111] mb-1 tracking-tight">
                Create Account
              </h2>
              <p className="text-gray-500 text-sm">
                Join our community of style enthusiasts.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-[#111] mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    className="w-full px-4 py-4 bg-[#f5f5f5] border-2 border-[#e8e8e8] rounded-xl text-sm font-medium text-[#111] placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white hover:border-gray-300 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-[#111] mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className="w-full px-4 py-4 bg-[#f5f5f5] border-2 border-[#e8e8e8] rounded-xl text-sm font-medium text-[#111] placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white hover:border-gray-300 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-[#111] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-4 py-4 bg-[#f5f5f5] border-2 border-[#e8e8e8] rounded-xl text-sm font-medium text-[#111] placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white hover:border-gray-300 transition-all duration-200"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-[#111] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-4 pr-12 bg-[#f5f5f5] border-2 border-[#e8e8e8] rounded-xl text-sm font-medium text-[#111] placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white hover:border-gray-300 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <IoEyeOff size={20} /> : <IoEye size={20} />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <p className="text-[11px] text-gray-400 leading-relaxed bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                By creating an account, you agree to our{" "}
                <span className="text-black font-bold underline cursor-pointer">Terms of Service</span>{" "}
                and{" "}
                <span className="text-black font-bold underline cursor-pointer">Privacy Policy</span>.
              </p>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-[0.25em] rounded-xl hover:bg-orange-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-black/15"
              >
                Get Started →
              </button>
            </motion.form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Or sign up with
                </span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button className="flex items-center justify-center gap-2.5 py-3.5 border-2 border-[#e8e8e8] rounded-xl text-xs font-black uppercase tracking-wider text-[#111] hover:border-black hover:bg-[#f5f5f5] transition-all duration-200">
                <FcGoogle size={19} />
                Google
              </button>
              <button className="flex items-center justify-center gap-2.5 py-3.5 border-2 border-[#e8e8e8] rounded-xl text-xs font-black uppercase tracking-wider text-[#111] hover:border-black hover:bg-[#f5f5f5] transition-all duration-200">
                <FaFacebook size={19} className="text-[#1877F2]" />
                Facebook
              </button>
            </div>

            {/* Switch */}
            <p className="text-center text-sm text-gray-500">
              Already a member?{" "}
              <Link
                href="/login"
                className="font-black text-black hover:text-orange-500 transition-colors underline underline-offset-2 decoration-2"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;