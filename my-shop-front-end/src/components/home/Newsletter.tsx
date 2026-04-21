"use client";

import Button from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  IoCheckmarkCircle,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTwitter,
  IoLogoYoutube,
  IoSparklesOutline,
} from "react-icons/io5";

interface NewsletterFormData {
  email: string;
}

type Persona = "minimalist" | "avant-garde" | "classicist";

const personas = [
  {
    id: "minimalist" as Persona,
    label: "Minimalist",
    description: "Monochrome, clean lines, and architectural silhouettes.",
    accent: "bg-white",
    hover: "hover:bg-white/20",
  },
  {
    id: "avant-garde" as Persona,
    label: "Avant-Garde",
    description: "Bold textures, experimental cuts, and boundary-pushing art.",
    accent: "bg-orange-500",
    hover: "hover:bg-orange-500/20",
  },
  {
    id: "classicist" as Persona,
    label: "Classicist",
    description: "Timeless tailoring, heritage fabrics, and refined elegance.",
    accent: "bg-blue-400",
    hover: "hover:bg-blue-400/20",
  },
];

const Newsletter: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewsletterFormData>();

  const onSubmit = (data: NewsletterFormData) => {
    console.log("Newsletter signup:", data, "Persona:", selectedPersona);
    setSubmitted(true);
    reset();
    setTimeout(() => {
      setSubmitted(false);
      setSelectedPersona(null);
    }, 4000);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/10">
      {/* Zone 1: The Social Fabric (LEFT) */}
      <div className="lg:w-1/3 h-1/2 lg:h-full relative flex items-center justify-center p-8 overflow-hidden group">
        <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-700" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <h3 className="text-white text-xs font-bold uppercase tracking-[0.4em] mb-10 opacity-60">
            Connect With The Fabric
          </h3>

          <div className="flex gap-8">
            {[
              {
                icon: <IoLogoFacebook size={26} />,
                label: "FB",
                color: "hover:text-blue-500",
              },
              {
                icon: <IoLogoInstagram size={26} />,
                label: "IG",
                color: "hover:text-pink-500",
              },
              {
                icon: <IoLogoYoutube size={26} />,
                label: "YT",
                color: "hover:text-red-500",
              },
              {
                icon: <IoLogoTwitter size={26} />,
                label: "TW",
                color: "hover:text-sky-400",
              },
            ].map((social, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ y: -5, scale: 1.1 }}
                className={`text-white transition-all duration-300 ${social.color}`}
              >
                {social.icon}
                <span className="block text-[8px] font-black mt-2 opacity-40">
                  {social.label}
                </span>
              </motion.a>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
              2.4k Real-time Stylists Active
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: The Style Persona (RIGHT) */}
      <div className="lg:w-2/3 h-1/2 lg:h-full relative overflow-hidden bg-black/20">
        <AnimatePresence mode="wait">
          {!selectedPersona ? (
            <motion.div
              key="persona-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full h-full flex flex-col justify-center p-8 lg:p-16"
            >
              <div className="flex items-center gap-2 mb-4">
                <IoSparklesOutline className="text-orange-500" size={16} />
                <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em]">
                  The Style Circle
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-serif italic text-white mb-8">
                Define Your Presence
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id)}
                    className={`text-left p-6 border border-white/10 rounded-xl transition-all duration-300 ${p.hover} group`}
                  >
                    <div className={`w-2 h-2 rounded-full mb-4 ${p.accent}`} />
                    <h4 className="text-white font-bold text-sm mb-2 uppercase tracking-widest">
                      {p.label}
                    </h4>
                    <p className="text-gray-400 text-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {p.description}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                <IoCheckmarkCircle size={40} className="text-orange-500" />
              </div>
              <h3 className="text-2xl font-serif italic text-white mb-2">
                Curation Activated
              </h3>
              <p className="text-gray-400 max-w-sm">
                Your portal to localized luxury is ready. Check your inbox for
                your first personalized lookbook.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="signup-form"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-full flex flex-col justify-center p-8 lg:p-16"
            >
              <button
                onClick={() => setSelectedPersona(null)}
                className="text-[10px] font-bold text-gray-400 mb-8 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
              >
                ← Back to Identities
              </button>

              <div className="mb-8">
                <span className="text-white text-[10px] font-black uppercase tracking-[0.4em] block mb-2 opacity-40">
                  {selectedPersona} EDITION
                </span>
                <h3 className="text-3xl font-serif italic text-white">
                  The Inner Circle
                </h3>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="relative max-w-lg"
              >
                <div className="flex flex-col sm:flex-row gap-0 group p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl focus-within:border-orange-500 transition-all duration-500">
                  <input
                    type="email"
                    placeholder="Enter Private Email"
                    {...register("email", {
                      required: "Identity verification requires email.",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid transmission address.",
                      },
                    })}
                    className="flex-1 bg-transparent px-6 py-4 text-white placeholder-gray-600 focus:outline-none text-base font-light tracking-wide lg:min-w-[300px]"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="rounded-2xl! px-10 py-4 h-full scale-100! hover:scale-105! transition-transform shadow-2xl whitespace-nowrap"
                  >
                    Gain Access
                  </Button>
                </div>
                {errors.email && (
                  <p className="text-orange-500 text-[10px] font-bold mt-4 uppercase tracking-[0.2em] ml-4">
                    {errors.email.message}
                  </p>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Newsletter;
