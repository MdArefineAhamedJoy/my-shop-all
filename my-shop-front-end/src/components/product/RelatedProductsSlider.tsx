"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Product } from "@/types/product.type";

interface RelatedProductsSliderProps {
  products: Product[];
}

const RelatedProductsSlider: React.FC<RelatedProductsSliderProps> = ({
  products,
}) => {
  return (
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
        {products.map((p) => (
          <SwiperSlide key={p.id}>
            <Link
              href={`/product/${p.slug}`}
              className="flex flex-col gap-6 group"
            >
              <div className="relative aspect-3/4 bg-[#fafafa] overflow-hidden">
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
              </div>

              <div className="text-center space-y-2">
                <div className="px-2">
                  <h4 className="text-[14px] md:text-[15px] font-serif italic text-[#1c1c1c] line-clamp-1 group-hover:text-gray-500 transition-colors">
                    {p.name}
                  </h4>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[12px] font-bold uppercase tracking-widest text-[#1c1c1c]">
                    Tk {p.price.toLocaleString()}.00
                  </p>
                  <div className="w-10 h-px bg-gray-200 mx-auto group-hover:w-16 transition-all duration-500" />
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default RelatedProductsSlider;
