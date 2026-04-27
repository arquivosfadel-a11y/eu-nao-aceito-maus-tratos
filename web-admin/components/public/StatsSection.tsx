"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const IMPACT = [
  {
    number: "30M+",
    label: "Animais em situação de rua no Brasil",
    description: "A maior população de animais abandonados da América Latina.",
  },
  {
    number: "80%",
    label: "dos casos nunca são denunciados",
    description: "O silêncio é cúmplice. Cada denúncia quebra esse ciclo.",
  },
  {
    number: "1.2k+",
    label: "animais resgatados pela plataforma",
    description: "E esse número cresce a cada hora com sua ajuda.",
  },
];

export function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24" style={{ background: "#F0F7F4" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div
          className="grid grid-cols-1 sm:grid-cols-3"
          style={{ borderTop: "1px solid rgba(216,97,12,0.15)", borderBottom: "1px solid rgba(216,97,12,0.15)" }}
        >
          {IMPACT.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.55, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center px-8 py-14"
              style={{
                borderRight: i < IMPACT.length - 1 ? "1px solid rgba(216,97,12,0.15)" : "none",
              }}
            >
              <span
                className="font-black leading-none mb-4"
                style={{ fontSize: "clamp(3rem, 6vw, 4.5rem)", color: "#d8610c" }}
              >
                {item.number}
              </span>
              <span className="text-base font-bold text-[#1B4332] mb-2">{item.label}</span>
              <span
                className="text-sm leading-relaxed max-w-xs"
                style={{ color: "rgba(26,26,46,0.55)" }}
              >
                {item.description}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
