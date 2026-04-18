"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";

interface StatItem {
  prefix?: string;
  value: number;
  suffix: string;
  label: string;
}

const STATS: StatItem[] = [
  { value: 1200, suffix: "+", label: "Animais salvos" },
  { value: 340, suffix: "", label: "Adotados" },
  { value: 80, suffix: "", label: "Protetores" },
  { value: 24, suffix: "h", label: "Atendimento" },
];

function AnimatedNumber({ value, suffix, started }: { value: number; suffix: string; started: boolean }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18, mass: 1 });
  const display = useTransform(spring, (v) => {
    if (value >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return Math.round(v).toString();
  });

  useEffect(() => {
    if (started) motionVal.set(value);
  }, [started, value, motionVal]);

  return (
    <span className="tabular-nums">
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

function PawSeparator() {
  return (
    <span className="hidden sm:flex flex-col items-center justify-center text-white/40 text-xl animate-pulse select-none" aria-hidden="true">
      🐾
    </span>
  );
}

export function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      style={{ backgroundColor: "#d8610c" }}
      className="relative overflow-hidden"
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-0 sm:divide-x sm:divide-white/20">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
                className="flex flex-col items-center text-center px-8"
              >
                <span className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} started={inView} />
                </span>
                <span className="mt-1.5 text-xs sm:text-sm font-bold text-white/70 uppercase tracking-widest">
                  {stat.label}
                </span>
              </motion.div>

              {i < STATS.length - 1 && <PawSeparator />}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
