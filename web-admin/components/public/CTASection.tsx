"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

function useLiveCounter(base: number, active: boolean) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3));
    }, 2800);
    return () => clearInterval(interval);
  }, [active]);
  return count;
}

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const liveCount = useLiveCounter(347, isInView);

  return (
    <section
      className="py-28 relative overflow-hidden"
      ref={ref}
      style={{ background: "linear-gradient(135deg, #1B4332 0%, #0F2B1E 50%, #0A0A0A 100%)" }}
    >
      {/* Decorative paw shapes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="absolute top-12 left-10 w-32 h-32 text-white/3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.5 11c1.381 0 2.5-1.567 2.5-3.5S5.881 4 4.5 4 2 5.567 2 7.5 3.119 11 4.5 11zm15 0c1.381 0 2.5-1.567 2.5-3.5S20.881 4 19.5 4 17 5.567 17 7.5 18.119 11 19.5 11zM8.5 9C9.881 9 11 7.433 11 5.5S9.881 2 8.5 2 6 3.567 6 5.5 7.119 9 8.5 9zm7 0C16.881 9 18 7.433 18 5.5S16.881 2 15.5 2 13 3.567 13 5.5 14.119 9 15.5 9zM12 11c-3.53 0-8 2.608-8 5.399 0 3.537 2.989 5.906 8 5.906s8-2.369 8-5.906C20 13.608 15.53 11 12 11z" />
        </svg>
        <svg className="absolute bottom-16 right-14 w-24 h-24 text-[#E8682A]/5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
        </svg>
        {/* Orange radial glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(232,104,42,0.12) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Live counter badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10 flex justify-center"
        >
          <div className="inline-flex items-center gap-3 bg-[#E8682A]/15 border border-[#E8682A]/30 text-[#F4A261] text-sm font-bold px-6 py-3 rounded-full">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8682A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E8682A]" />
            </span>
            <span>
              <motion.span
                key={liveCount}
                initial={{ opacity: 0.5, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="tabular-nums"
              >
                {liveCount.toLocaleString("pt-BR")}
              </motion.span>
              {" "}animais precisam de ajuda agora
            </span>
          </div>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-none mb-6 tracking-tight">
            Você viu.
            <br />
            <span className="text-[#E8682A]">Não ignore.</span>
          </h2>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
            Baixe o app e faça sua denúncia agora.
            <br className="hidden sm:block" />
            <span className="text-white/90 font-bold">É gratuito. É anônimo. É urgente.</span>
          </p>
        </motion.div>

        {/* Pulsing CTA button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <Link
            href="#"
            className="relative w-full sm:w-auto group cursor-pointer"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#E8682A] animate-[pulse-orange_2s_ease-in-out_infinite]" />
            <span className="relative flex items-center justify-center gap-3 bg-[#E8682A] hover:bg-[#F4A261] text-black font-extrabold py-5 px-12 rounded-full text-lg transition-colors duration-200 shadow-xl shadow-[#E8682A]/30">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              Baixe o App — Denuncie Agora
            </span>
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto border-2 border-white/20 hover:border-white/50 hover:bg-white/5 text-white font-extrabold py-5 px-10 rounded-full text-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
            Seja um Protetor
          </Link>
        </motion.div>

        {/* VETech attribution */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-white/30 text-sm font-medium"
        >
          Uma iniciativa{" "}
          <a
            href="https://www.vetechsystems.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-[#F4A261] font-bold transition-colors cursor-pointer underline underline-offset-2"
          >
            VETech Systems
          </a>{" "}
          para proteger quem não tem voz.
        </motion.p>
      </div>
    </section>
  );
}
