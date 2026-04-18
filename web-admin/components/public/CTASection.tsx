"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

/* ── Floating paw positions ── */
const PAWS = [
  { top: "8%",  left: "5%",  size: 48, dur: 7,  delay: 0   },
  { top: "20%", left: "92%", size: 32, dur: 9,  delay: 1.5 },
  { top: "65%", left: "3%",  size: 56, dur: 8,  delay: 0.8 },
  { top: "80%", left: "88%", size: 40, dur: 10, delay: 2.2 },
  { top: "45%", left: "96%", size: 24, dur: 6,  delay: 3.0 },
  { top: "90%", left: "18%", size: 36, dur: 8,  delay: 1.0 },
  { top: "10%", left: "75%", size: 28, dur: 7,  delay: 4.0 },
  { top: "55%", left: "8%",  size: 20, dur: 9,  delay: 2.5 },
];

/* ── Typewriter hook ── */
function useTypewriter(phrases: string[], active: boolean) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0=idle 1=first 2=second
  const [chars, setChars] = useState(0);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setPhase(1), 400);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => {
    if (phase === 1) {
      if (chars < phrases[0].length) {
        const t = setTimeout(() => setChars((c) => c + 1), 60);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => { setPhase(2); setChars(0); }, 600);
        return () => clearTimeout(t);
      }
    }
    if (phase === 2) {
      if (chars < phrases[1].length) {
        const t = setTimeout(() => setChars((c) => c + 1), 70);
        return () => clearTimeout(t);
      }
    }
  }, [phase, chars, phrases]);

  return { phase, chars };
}

/* ── Live counter cycling 847–1203 ── */
function useCyclingCounter(active: boolean) {
  const [count, setCount] = useState(847 + Math.floor(Math.random() * 356));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCount(847 + Math.floor(Math.random() * 356));
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(id);
  }, [active]);

  return { count, visible };
}

export function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const { phase, chars } = useTypewriter(["Você viu.", "Não ignore."], inView);
  const { count, visible } = useCyclingCounter(inView);

  const line1 = phase >= 1 ? "Você viu.".slice(0, phase === 1 ? chars : 9) : "";
  const line2 = phase === 2 ? "Não ignore.".slice(0, chars) : "";
  const showCursor1 = phase === 1;
  const showCursor2 = phase === 2;

  return (
    <motion.section
      ref={ref}
      id="denunciar"
      className="relative py-32 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1B4332 0%, #0A2E1F 100%)" }}
      initial={{ scale: 0.95, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Floating paw decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {PAWS.map((p, i) => (
          <span
            key={i}
            className="absolute select-none"
            style={{
              top: p.top,
              left: p.left,
              fontSize: p.size,
              opacity: 0.05,
              animation: `float ${p.dur}s ease-in-out ${p.delay}s infinite`,
            }}
          >
            🐾
          </span>
        ))}
      </div>

      {/* Concentric ripple waves */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 320,
              height: 320,
              border: "1.5px solid rgba(216,97,12,0.25)",
              animation: `ripple 4s ease-out ${i * 1.3}s infinite`,
              opacity: 0.5 - i * 0.12,
            }}
          />
        ))}
      </div>

      {/* Orange radial glow center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(216,97,12,0.12) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Live counter badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10 flex justify-center"
        >
          <div
            className="inline-flex items-center gap-3 text-sm font-bold px-6 py-3 rounded-full"
            style={{
              background: "rgba(216,97,12,0.15)",
              border: "1px solid rgba(216,97,12,0.3)",
              color: "#F4A261",
            }}
          >
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d8610c] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d8610c]" />
            </span>
            <span>
              <span
                className="tabular-nums transition-opacity duration-300"
                style={{ opacity: visible ? 1 : 0 }}
              >
                🐾 {count.toLocaleString("pt-BR")}
              </span>
              {" "}animais precisando de ajuda agora
            </span>
          </div>
        </motion.div>

        {/* Typewriter headline */}
        <div className="mb-6 min-h-[220px] flex flex-col items-center justify-center">
          <h2
            className="font-black text-white leading-none tracking-tight"
            style={{ fontSize: "clamp(52px, 8vw, 88px)" }}
          >
            {line1}
            {showCursor1 && (
              <span className="animate-[blink_0.8s_step-end_infinite] inline-block w-[3px] h-[0.85em] bg-white ml-1 align-middle" aria-hidden="true" />
            )}
          </h2>
          {phase >= 2 && (
            <h2
              className="font-black leading-none tracking-tight"
              style={{ fontSize: "clamp(52px, 8vw, 88px)", color: "#d8610c" }}
            >
              {line2}
              {showCursor2 && chars < 11 && (
                <span className="animate-[blink_0.8s_step-end_infinite] inline-block w-[3px] h-[0.85em] bg-[#d8610c] ml-1 align-middle" aria-hidden="true" />
              )}
            </h2>
          )}
        </div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl mb-14 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          Baixe o app, faça sua denúncia agora.{" "}
          <span className="text-white font-bold">É gratuito, é anônimo, é urgente.</span>
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          {/* Denunciar Agora — pulse */}
          <Link
            href="#"
            className="relative w-full sm:w-auto cursor-pointer"
          >
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-25"
              style={{ backgroundColor: "#d8610c" }}
              aria-hidden="true"
            />
            <span
              className="relative flex items-center justify-center gap-3 font-extrabold text-white py-5 px-12 rounded-full text-lg transition-all duration-200 hover:brightness-110"
              style={{ backgroundColor: "#d8610c", boxShadow: "0 8px 36px rgba(216,97,12,0.45)" }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Denunciar Agora
            </span>
          </Link>

          {/* Baixe o App */}
          <Link
            href="#"
            className="w-full sm:w-auto border-2 border-white/30 text-white font-extrabold py-5 px-10 rounded-full text-lg cursor-pointer flex items-center justify-center gap-3 transition-all duration-200"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#fff";
              (e.currentTarget as HTMLElement).style.color = "#1B4332";
              (e.currentTarget as HTMLElement).style.borderColor = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#fff";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)";
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            Baixe o App
          </Link>
        </motion.div>

        {/* Attribution */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          Uma iniciativa{" "}
          <a
            href="https://www.vetechsystems.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-2 transition-colors cursor-pointer hover:text-[#F4A261]"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            VETech Systems
          </a>{" "}
          para proteger quem não tem voz.
        </motion.p>
      </div>
    </motion.section>
  );
}
