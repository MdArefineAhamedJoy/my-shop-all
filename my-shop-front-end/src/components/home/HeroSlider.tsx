"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

// Using high-quality Unsplash images for fashion/lifestyle
const slides: HeroSlide[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
    title: "Redefine Your Style",
    subtitle: "New Winter Collection 2026",
    ctaText: "Shop Now",
    ctaLink: "/shop?tag=new-arrival",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=2070&auto=format&fit=crop",
    title: "Where Comfort Meets Elegance",
    subtitle: "Premium Cotton Collection",
    ctaText: "Explore",
    ctaLink: "/shop?category=shirt",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
    title: "Crafted for the Modern You",
    subtitle: "Exclusive Lifestyle Range",
    ctaText: "Discover",
    ctaLink: "/shop",
  },
];

const HeroSlider: React.FC = () => {
  return (
    // Height reduced as requested
    <section className="relative w-full h-[400px] md:h-[500px] lg:h-[550px]">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          el: ".swiper-custom-pagination",
        }}
        navigation={{
          nextEl: ".swiper-custom-next",
          prevEl: ".swiper-custom-prev",
        }}
        loop={true}
        className="w-full h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full overflow-hidden">
              {/* Background Image using Image for optimization */}
              <div className="absolute inset-0">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />

              {/* Content */}
              <div className="relative h-full container flex items-center px-4 md:px-8">
                <motion.div
                  initial={{ opacity: 0, x: -30 }} // Changed animation to slide from left
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="max-w-2xl text-white z-10 w-full pl-4 md:pl-0"
                >
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-sm md:text-base mb-3 md:mb-5 tracking-[0.2em] uppercase text-orange-400 font-bold"
                  >
                    {slide.subtitle}
                  </motion.p>

                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 md:mb-8 leading-tight drop-shadow-lg"
                  >
                    {slide.title}
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <Link href={slide.ctaLink}>
                      {/* Unique Button Design: Angled corners + Gradient + Hover Lift */}
                      <button className="relative overflow-hidden group px-8 py-4 bg-white text-gray-900 font-bold text-lg uppercase tracking-wider clip-path-slant transition-all duration-300 hover:text-white hover:scale-105">
                        <span className="relative z-10 flex items-center gap-2">
                          {slide.ctaText}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                            />
                          </svg>
                        </span>
                        <div className="absolute inset-0 bg-orange-600 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                      </button>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </SwiperSlide>
        ))}

        {/* Custom Pagination */}
        <div className="swiper-custom-pagination absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3"></div>
      </Swiper>

      <style jsx global>{`
        .swiper-custom-pagination .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: white;
          opacity: 0.5;
          transition: all 0.3s;
        }
        .swiper-custom-pagination .swiper-pagination-bullet-active {
          opacity: 1;
          background: #f97316;
          width: 32px;
          border-radius: 6px;
        }
      `}</style>
    </section>
  );
};

export default HeroSlider;
