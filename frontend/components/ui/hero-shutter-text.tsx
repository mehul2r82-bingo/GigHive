"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroIntro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hero-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#09090B]"
        >
          {/* Faint animated grid */}
          <motion.div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            animate={{ backgroundPosition: ["0px 0px", "48px 48px"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Content lockup — fixed max width, single line, no per-character logic */}
          <div
            className="relative z-10 flex flex-col items-center px-6"
            style={{ maxWidth: 420, width: "100%" }}
          >
            {/* Soft glow behind the logo */}
            <motion.div
              className="absolute rounded-full bg-indigo-500/25 blur-3xl"
              style={{ width: 220, height: 220, top: -40 }}
              animate={{ opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Logo mark: scale 0.9 -> 1.0, fade in, subtle blur reveal */}
            <motion.svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              className="relative mb-5"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              <rect width="24" height="24" rx="6" fill="#4F46E5" />
              <path
                d="M12 5.5 L18 9 V15 L12 18.5 L6 15 V9 Z"
                stroke="white"
                strokeWidth="1.4"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="12" cy="12" r="1.8" fill="white" />
            </motion.svg>

            {/* Wordmark — always one word, one line */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              className="relative whitespace-nowrap text-4xl sm:text-5xl font-bold tracking-tight text-white"
            >
              GigHive
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative mt-3 text-sm text-zinc-500 tracking-wide"
            >
              Campus Task Marketplace
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
