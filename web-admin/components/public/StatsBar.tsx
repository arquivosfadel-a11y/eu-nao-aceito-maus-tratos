"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";

const STATS = [
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

export function StatsBar() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ backgroundColor: "#1B4332" }}>
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <span
                className="tabular-nums leading-none tracking-tight font-black"
                style={{ fontSize: 40, color: "#d8610c" }}
              >
                <AnimatedNumber value={stat.value} suffix={stat.suffix} started={inView} />
              </span>
              <span
                className="mt-2 text-xs font-bold uppercase"
                style={{ letterSpacing: 1, color: "rgba(255,255,255,0.5)" }}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
