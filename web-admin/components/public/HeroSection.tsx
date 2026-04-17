"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const PARTICLES = [
  { x: "8%",  y: "15%", size: 3, dur: 6,  delay: 0   },
  { x: "22%", y: "72%", size: 2, dur: 8,  delay: 1.2 },
  { x: "35%", y: "30%", size: 4, dur: 7,  delay: 0.5 },
  { x: "50%", y: "85%", size: 2, dur: 9,  delay: 2   },
  { x: "63%", y: "20%", size: 3, dur: 6,  delay: 1.8 },
  { x: "78%", y: "60%", size: 5, dur: 10, delay: 0.3 },
  { x: "90%", y: "40%", size: 2, dur: 7,  delay: 3   },
  { x: "15%", y: "50%", size: 3, dur: 8,  delay: 1.5 },
  { x: "45%", y: "10%", size: 2, dur: 9,  delay: 2.5 },
  { x: "70%", y: "90%", size: 4, dur: 6,  delay: 0.8 },
  { x: "55%", y: "55%", size: 2, dur: 11, delay: 1.1 },
  { x: "5%",  y: "80%", size: 3, dur: 7,  delay: 3.5 },
  { x: "88%", y: "12%", size: 2, dur: 8,  delay: 0.7 },
  { x: "30%", y: "65%", size: 4, dur: 9,  delay: 2.2 },
  { x: "72%", y: "35%", size: 2, dur: 6,  delay: 1.6 },
  { x: "42%", y: "48%", size: 3, dur: 10, delay: 4   },
  { x: "18%", y: "92%", size: 2, dur: 7,  delay: 0.4 },
  { x: "95%", y: "70%", size: 3, dur: 8,  delay: 2.8 },
];

const TITLE_LINE2 = "ACEITO.";

export function HeroSection() {
  const [chars2, setChars2] = useState(0);
  const [line1Done, setLine1Done] = useState(false);
  const [line1Visible, setLine1Visible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLine1Visible(true), 400);
    const t2 = setTimeout(() => setLine1Done(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (!line1Done) return;
    if (chars2 >= TITLE_LINE2.length) return;
    const timer = setTimeout(() => setChars2((c) => c + 1), 80);
    return () => clearTimeout(timer);
  }, [line1Done, chars2]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Gradient fade to green at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#1B4332]/60 to-transparent pointer-events-none" />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#E8682A] opacity-40"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Subtle radial glow center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,104,42,0.06) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20 pb-12">
        {/* Abril Laranja badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 bg-[#E8682A]/15 border border-[#E8682A]/30 text-[#F4A261] text-xs font-bold px-5 py-2 rounded-full tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#E8682A] animate-pulse inline-block" />
            Abril Laranja — Mês de Prevenção contra Maus Tratos
          </span>
        </motion.div>

        {/* Logo with orange pulse glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-10 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#E8682A]/30 blur-xl animate-[pulse-orange_3s_ease-in-out_infinite]" />
            <Image
              src="/logo.png"
              alt="Eu Não Aceito Maus Tratos"
              width={110}
              height={110}
              className="relative rounded-full drop-shadow-2xl"
              priority
            />
          </div>
        </motion.div>

        {/* Typewriter title */}
        <div className="mb-8">
          <div className="text-7xl sm:text-8xl md:text-9xl font-black leading-none tracking-tighter">
            {/* Line 1 */}
            <div className="text-white overflow-hidden">
              <motion.span
                initial={{ y: "100%" }}
                animate={line1Visible ? { y: "0%" } : { y: "100%" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                EU NÃO
              </motion.span>
            </div>
            {/* Line 2 — typewriter */}
            <div className="text-[#E8682A] min-h-[1em] flex items-end justify-center">
              <span>
                {TITLE_LINE2.slice(0, chars2)}
                {chars2 < TITLE_LINE2.length && line1Done && (
                  <span className="animate-[blink_0.8s_step-end_infinite] inline-block w-[0.06em] h-[0.85em] bg-[#E8682A] ml-1 align-middle" />
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.8 }}
          className="text-lg sm:text-xl md:text-2xl text-white/60 leading-relaxed max-w-2xl mx-auto mb-12 font-medium"
        >
          Cada denúncia salva uma vida.{" "}
          <span className="text-white/90">Seja a voz de quem não pode falar.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.0 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="#como-funciona"
            className="group relative w-full sm:w-auto bg-[#E8682A] text-black font-extrabold py-4 px-10 rounded-full text-lg transition-all duration-200 cursor-pointer shadow-lg shadow-[#E8682A]/30 hover:shadow-[#E8682A]/60 hover:shadow-xl hover:scale-[1.03] active:scale-100 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              Denunciar agora
            </span>
          </Link>
          <Link
            href="#adocao"
            className="w-full sm:w-auto border-2 border-white/30 hover:border-[#52B788] hover:bg-[#52B788]/10 text-white font-extrabold py-4 px-10 rounded-full text-lg transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-100"
          >
            Adotar um animal
          </Link>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 2.3 }}
          className="mt-12 flex flex-wrap justify-center gap-8 text-xs text-white/40 font-semibold tracking-widest uppercase"
        >
          {["100% Gratuito", "Anônimo", "Protetores Verificados"].map((label) => (
            <span key={label} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#E8682A]" />
              {label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.6 }}
        className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2"
      >
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-1.5 h-1.5 bg-[#E8682A] rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
