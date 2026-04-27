"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const PAWS = [
  { top: "8%",  left: "5%",  size: 48, rotate: -15 },
  { top: "20%", left: "92%", size: 32, rotate: 20  },
  { top: "65%", left: "3%",  size: 56, rotate: 8   },
  { top: "80%", left: "88%", size: 40, rotate: -30 },
  { top: "45%", left: "96%", size: 24, rotate: 5   },
  { top: "90%", left: "18%", size: 36, rotate: 10  },
  { top: "10%", left: "75%", size: 28, rotate: -10 },
  { top: "55%", left: "8%",  size: 20, rotate: 25  },
];

export function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="denunciar"
      className="relative py-32 overflow-hidden"
      style={{ background: "#1B4332" }}
    >
      {/* Paws */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {PAWS.map((p, i) => (
          <span
            key={i}
            className="absolute select-none"
            style={{
              top: p.top,
              left: p.left,
              fontSize: p.size,
              opacity: 0.04,
              transform: `rotate(${p.rotate}deg)`,
              animation: "float 8s ease-in-out infinite",
              animationDelay: `${i * 0.8}s`,
            }}
          >
            🐾
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h2
            className="font-black leading-tight"
            style={{ fontSize: 48 }}
          >
            <span className="text-white">Você viu.</span>
            <br />
            <span style={{ color: "#d8610c" }}>Não ignore.</span>
          </h2>
        </motion.div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg mb-12 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          Baixe o app, faça sua denúncia agora.{" "}
          <span className="text-white font-bold">É gratuito, é anônimo, é urgente.</span>
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14"
        >
          {/* Pulsing primary button */}
          <Link href="#" className="relative w-full sm:w-auto cursor-pointer">
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

          <Link
            href="#"
            className="w-full sm:w-auto border-2 border-white/30 text-white font-extrabold py-5 px-10 rounded-full text-lg cursor-pointer flex items-center justify-center gap-3 transition-all duration-200 hover:bg-white hover:text-[#1B4332] hover:border-white"
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
    </section>
  );
}
