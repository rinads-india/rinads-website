"use client";

import { motion } from "framer-motion";

export function GameBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 rinads-bg-glow" />
      {/* Data stream / flowing lines */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-[var(--rinads-primary)] to-transparent"
          style={{ top: "20%" }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "loop" }}
        />
        <motion.div
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-[var(--rinads-circuit)] to-transparent"
          style={{ top: "40%" }}
          animate={{ x: ["100%", "-100%"] }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "loop" }}
        />
        <motion.div
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-[var(--rinads-primary)] to-transparent"
          style={{ top: "60%" }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 12, repeat: Infinity, repeatType: "loop" }}
        />
        <motion.div
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-[var(--rinads-circuit)] to-transparent"
          style={{ top: "80%" }}
          animate={{ x: ["100%", "-100%"] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: "loop" }}
        />
      </div>
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(var(--rinads-primary) 1px, transparent 1px),
            linear-gradient(90deg, var(--rinads-primary) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow orbs - kept away from main content area */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-[var(--rinads-primary)] blur-[80px] opacity-15" />
      <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-[var(--rinads-primary)] blur-[100px] opacity-10" />
    </div>
  );
}
