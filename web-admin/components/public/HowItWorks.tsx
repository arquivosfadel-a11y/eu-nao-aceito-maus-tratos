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

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="como-funciona"
      className="relative py-24 overflow-hidden bg-white"
    >
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
              className="inline-block text-xs font-bold uppercase px-4 py-1.5"
              style={{ color: "#d8610c", letterSpacing: "2px" }}
            >
              COMO FUNCIONA
            </span>
          </motion.div>

          <div className="overflow-hidden mb-4">
            <motion.h2
              initial={{ y: "110%" }}
              animate={inView ? { y: "0%" } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-black text-[#1B4332] leading-tight"
              style={{ fontSize: 36 }}
            >
              3 passos que salvam{" "}
              <span style={{ color: "#d8610c" }}>vidas</span>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base max-w-xl mx-auto leading-relaxed"
            style={{ color: "rgba(26,26,46,0.55)" }}
          >
            Sua atitude faz a diferença na vida de quem não tem voz.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -40 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.2 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.25, ease: "easeOut" } }}
              className="group relative flex flex-col overflow-hidden cursor-default"
              style={{
                padding: 32,
                borderRadius: 16,
                border: "1px solid #f0f0f0",
                background: "#fff",
                boxShadow: "0 4px 16px rgba(27,67,50,0.06)",
                transition: "box-shadow 0.25s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 48px rgba(27,67,50,0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(27,67,50,0.06)";
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

              {/* Step badge */}
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white mb-5 flex-shrink-0"
                style={{ backgroundColor: "#1B4332" }}
              >
                {step.number}
              </span>

              {/* Icon */}
              <div className="mb-5" style={{ color: "#d8610c" }}>
                {step.icon}
              </div>

              <h3 className="text-xl font-black text-[#1B4332] mb-3 relative z-10">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed relative z-10" style={{ color: "rgba(26,26,46,0.6)" }}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
