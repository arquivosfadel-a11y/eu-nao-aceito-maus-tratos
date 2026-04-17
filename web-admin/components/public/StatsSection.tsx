"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

function useCountUp(end: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    setValue(0);
    const steps = 60;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setValue(Math.round((current / steps) * end));
      if (current >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [end, duration, active]);
  return value;
}

const shockStats = [
  {
    label: "animais em situação de rua no Brasil",
    number: 30,
    suffix: " milhões",
    legend: "A maior população de animais abandonados da América Latina.",
  },
  {
    label: "dos casos nunca são denunciados",
    number: 80,
    suffix: "%",
    legend: "O silêncio é cúmplice. Cada denúncia quebra esse ciclo.",
  },
  {
    label: "animais resgatados pela plataforma",
    number: 1200,
    suffix: "+",
    legend: "E esse número cresce a cada hora com sua ajuda.",
  },
];

function StatBlock({
  stat,
  active,
  index,
}: {
  stat: (typeof shockStats)[0];
  active: boolean;
  index: number;
}) {
  const count = useCountUp(stat.number, 1800, active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.15 + index * 0.2, ease: "easeOut" }}
      className="text-center px-4"
    >
      <div className="tabular-nums font-black leading-none mb-3 text-[#E8682A]" style={{ fontSize: "clamp(3.5rem, 8vw, 6rem)" }}>
        {count.toLocaleString("pt-BR")}
        <span className="text-[0.5em] ml-1">{stat.suffix}</span>
      </div>
      <div className="text-white/90 font-bold text-lg mb-2 max-w-xs mx-auto">{stat.label}</div>
      <div className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">{stat.legend}</div>
    </motion.div>
  );
}

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="numeros" className="py-28 bg-[#1B4332] relative overflow-hidden" ref={ref}>
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#0A0A0A]/30" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-[#0A0A0A]/20" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block bg-[#E8682A]/15 border border-[#E8682A]/30 text-[#F4A261] text-xs font-bold px-5 py-2 rounded-full mb-6 tracking-widest uppercase">
            A Realidade
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
            A realidade que precisamos
            <br />
            <span className="text-[#E8682A]">mudar agora</span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-6 mb-20">
          {shockStats.map((stat, i) => (
            <StatBlock key={i} stat={stat} active={isInView} index={i} />
          ))}
        </div>

        {/* Animated orange separator */}
        <div className="relative h-px">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E8682A] to-transparent origin-left"
          />
        </div>

        {/* Call to action text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 1.2 }}
          className="text-center text-white/50 text-sm mt-8 tracking-wide"
        >
          Cada segundo conta. Cada denúncia importa.
        </motion.p>
      </div>
    </section>
  );
}
