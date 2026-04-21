"use client";

import { motion } from "framer-motion";

const Loading = () => {
  return (
    <div className="fixed inset-0 z-9999 bg-white flex flex-col items-center justify-center">
      <div className="relative flex flex-col items-center gap-6">
        {/* elegant minimal loader */}
        <div className="relative w-20 h-20">
          <motion.div
            className="absolute inset-0 border-2 border-gray-100 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.div
            className="absolute inset-0 border-t-2 border-[#1c1c1c] rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* Brand Text */}
        <div className="flex flex-col items-center gap-1">
          <motion.h2
            className="text-xl font-serif italic text-[#1c1c1c] tracking-widest"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            MYSHOP
          </motion.h2>
          <motion.p
            className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Premium Fashion
          </motion.p>
        </div>
      </div>

      {/* Progress Bar Top */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#1c1c1c] origin-left z-10000"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </div>
  );
};

export default Loading;
