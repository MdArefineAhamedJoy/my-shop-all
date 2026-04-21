"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import React, { useState } from "react";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen h-dvh bg-white flex flex-col lg:flex-row overflow-hidden">

      {/* ══════════════════════════════
          Visual Side — Desktop only
      ══════════════════════════════ */}
      <div className="hidden lg:block lg:w-[48%] flex-shrink-0 relative bg-[#111]">
        <Image
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop&crop=top"
          alt="Fashion Model"
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
          className="absolute bottom-0 left-0 right-0 p-12 text-white z-10"
        >
          <span className="text-xs font-bold uppercase tracking-[0.45em] text-orange-500 block mb-4">
            The Archive
          </span>
          <h1 className="text-5xl font-black italic leading-[1.1] mb-4">
            Revisit your<br />curated style.
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
            Access your dashboard, track orders, and explore the season&apos;s most exclusive pieces.
          </p>
          <div className="flex items-center gap-3 mt-8">
            <div className="w-10 h-px bg-white/30" />
            <span className="text-[10px] tracking-[0.4em] text-white/40 uppercase font-bold">Est. 2024</span>
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
            src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop&crop=top"
            alt="Fashion Model"
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
              className="mb-8"
            >
              <div className="hidden lg:flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-orange-500" />
                <span className="text-xl font-black">MY<span className="text-orange-500">SHOP</span></span>
              </div>
              <h2 className="text-3xl font-black text-[#111] mb-1 tracking-tight">
                Welcome Back!
              </h2>
              <p className="text-gray-500 text-sm">
                Sign in to continue your shopping experience.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-5"
              onSubmit={(e) => e.preventDefault()}
            >
              {/* Email Field */}
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

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-[#111]">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-black uppercase tracking-wider text-orange-500 hover:text-orange-700 transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-[0.25em] rounded-xl hover:bg-orange-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-black/15 mt-2"
              >
                Sign In →
              </button>
            </motion.form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
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
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-black text-black hover:text-orange-500 transition-colors underline underline-offset-2 decoration-2"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;