"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";

interface ClassicBannerProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  height?: string;
}

const ClassicBanner: React.FC<ClassicBannerProps> = ({
  title,
  subtitle,
  backgroundImage,
  height = "h-[250px] md:h-[350px]",
}) => {
  return (
    <section className={`relative w-full ${height} overflow-hidden`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt={title}
          fill
          priority
          unoptimized
          className="object-cover grayscale-30 brightness-75 scale-105"
          style={{ objectPosition: "center 20%" }}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Decorative Borders (Old Vibe) */}
      <div className="absolute inset-4 border border-white/20 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
      <div className="absolute inset-8 border border-white/10 z-10 pointer-events-none" />

      {/* Content */}
      <div className="relative h-full container z-20 flex flex-col items-center justify-center text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1 border border-orange-500 text-orange-400 text-xs md:text-sm tracking-[0.3em] uppercase mb-4 bg-black/40 backdrop-blur-sm">
            Collection 2026
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight drop-shadow-2xl">
            {title}
          </h1>
          <p className="text-base md:text-xl font-medium opacity-90 max-w-xl mx-auto italic font-serif">
            &ldquo;{subtitle}&rdquo;
          </p>
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-linear-to-t from-black/50 to-transparent z-10" />
    </section>
  );
};

export default ClassicBanner;
