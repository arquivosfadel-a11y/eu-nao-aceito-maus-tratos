"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const STEPS = [
  {
    number: "1",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: "Você é os olhos da cidade",
    description: "Cada pessoa que presencia um mau trato tem o poder de mudar aquela vida. Um registro no app leva segundos e pode salvar um animal para sempre.",
  },
  {
    number: "2",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Sua denúncia não some no vazio",
    description: "Nossa equipe recebe, valida e encaminha cada caso ao protetor mais próximo. Nada é ignorado. Todo animal merece uma resposta.",
  },
  {
    number: "3",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Protetores reais em ação",
    description: "Voluntários dedicados recebem o chamado e partem para o resgate. Sua denúncia coloca em movimento uma corrente real de amor e proteção.",
  },
];

function ConnectorLine({ inView }: { inView: boolean }) {
  return (
    <div
      className="hidden lg:block absolute pointer-events-none z-10"
      style={{ top: "80px", left: "calc(33.333% + 16px)", right: "calc(33.333% + 16px)" }}
      aria-hidden="true"
    >
      <svg width="100%" height="40" viewBox="0 0 400 40" preserveAspectRatio="none" fill="none">
        {/* Left segment */}
        <motion.path
          d="M 10 20 L 190 20"
          stroke="#52B788"
          strokeWidth="2"
          strokeOpacity="0.45"
          strokeDasharray="200"
          initial={{ strokeDashoffset: 200 }}
          animate={inView ? { strokeDashoffset: 0 } : { strokeDashoffset: 200 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
        />
        {/* Arrow left */}
        <motion.path
          d="M 181 14 L 192 20 L 181 26"
          stroke="#52B788"
          strokeWidth="2"
          strokeOpacity="0.45"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: 1.35 }}
        />
        {/* Right segment */}
        <motion.path
          d="M 210 20 L 390 20"
          stroke="#52B788"
          strokeWidth="2"
          strokeOpacity="0.45"
          strokeDasharray="200"
          initial={{ strokeDashoffset: 200 }}
          animate={inView ? { strokeDashoffset: 0 } : { strokeDashoffset: 200 }}
          transition={{ duration: 0.8, delay: 1.1, ease: "easeInOut" }}
        />
        {/* Arrow right */}
        <motion.path
          d="M 381 14 L 392 20 L 381 26"
          stroke="#52B788"
          strokeWidth="2"
          strokeOpacity="0.45"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: 1.85 }}
        />
      </svg>
    </div>
  );
}

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="como-funciona"
      className="relative py-24 overflow-hidden bg-white"
    >
      {/* Paw pattern background */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Ctext x='16' y='44' font-size='32' fill='%231B4332' opacity='0.03'%3E%F0%9F%90%BE%3C/text%3E%3C/svg%3E")`,
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-3"
          >
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
              style={{ background: "rgba(27,67,50,0.07)", color: "#1B4332" }}
            >
              Como Funciona
            </span>
          </motion.div>

          <div className="overflow-hidden mb-4">
            <motion.h2
              initial={{ y: "110%" }}
              animate={inView ? { y: "0%" } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl font-black text-[#1B4332] leading-tight"
            >
              Três passos que salvam{" "}
              <span style={{ color: "#d8610c" }}>vidas</span>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base text-[#1A1A2E]/55 max-w-xl mx-auto leading-relaxed"
          >
            Sua atitude faz a diferença na vida de quem não tem voz.
          </motion.p>
        </div>

        {/* Cards + SVG connector */}
        <div className="relative">
          <ConnectorLine inView={inView} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.65, delay: 0.2 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.25, ease: "easeOut" } }}
                className="group relative flex flex-col p-8 rounded-[24px] overflow-hidden cursor-default"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(27,67,50,0.1)",
                  boxShadow: "0 8px 32px rgba(27,67,50,0.08)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 48px rgba(27,67,50,0.16)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(27,67,50,0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(27,67,50,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(27,67,50,0.1)";
                }}
              >
                {/* Giant number watermark */}
                <span
                  className="absolute -bottom-4 -right-2 text-[120px] font-black leading-none select-none pointer-events-none"
                  style={{ color: "#1B4332", opacity: 0.04 }}
                  aria-hidden="true"
                >
                  {step.number}
                </span>

                {/* Step number badge */}
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white mb-5 flex-shrink-0"
                  style={{ backgroundColor: "#1B4332" }}
                >
                  {step.number}
                </span>

                {/* Icon — smooth rotation on group hover */}
                <motion.div
                  className="mb-5"
                  style={{ color: "#d8610c" }}
                  whileHover={{ rotate: [0, -12, 10, -6, 0], transition: { duration: 0.5 } }}
                >
                  {step.icon}
                </motion.div>

                <h3 className="text-xl font-black text-[#1B4332] mb-3 relative z-10">
                  {step.title}
                </h3>
                <p className="text-sm text-[#1A1A2E]/60 leading-relaxed relative z-10">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
