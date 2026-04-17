"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const PawSVG = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4.5 11c1.381 0 2.5-1.567 2.5-3.5S5.881 4 4.5 4 2 5.567 2 7.5 3.119 11 4.5 11zm15 0c1.381 0 2.5-1.567 2.5-3.5S20.881 4 19.5 4 17 5.567 17 7.5 18.119 11 19.5 11zM8.5 9C9.881 9 11 7.433 11 5.5S9.881 2 8.5 2 6 3.567 6 5.5 7.119 9 8.5 9zm7 0C16.881 9 18 7.433 18 5.5S16.881 2 15.5 2 13 3.567 13 5.5 14.119 9 15.5 9zM12 11c-3.53 0-8 2.608-8 5.399 0 3.537 2.989 5.906 8 5.906s8-2.369 8-5.906C20 13.608 15.53 11 12 11z" />
  </svg>
);

const ShieldSVG = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
  </svg>
);

const HeartSVG = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
  </svg>
);

const steps = [
  {
    Icon: PawSVG,
    number: "01",
    title: "Cidadão Denuncia",
    description:
      "Registre a denúncia pelo app com foto, localização e descrição. Simples, rápido e anônimo. Em menos de 2 minutos você já salvou uma vida.",
    accent: "#E8682A",
  },
  {
    Icon: ShieldSVG,
    number: "02",
    title: "Validador Encaminha",
    description:
      "Nossa equipe analisa a denúncia e encaminha ao protetor voluntário mais próximo da ocorrência. Resposta em até 24 horas.",
    accent: "#52B788",
  },
  {
    Icon: HeartSVG,
    number: "03",
    title: "Protetor Atende",
    description:
      "O protetor verificado vai ao local, resgata o animal e atualiza o status em tempo real. Você acompanha cada passo.",
    accent: "#1B4332",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="como-funciona" className="py-28 bg-[#FDF8F3]" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block bg-[#E8682A]/10 text-[#E8682A] text-xs font-bold px-5 py-2 rounded-full mb-6 tracking-widest uppercase border border-[#E8682A]/20">
            Como Funciona
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0A0A0A] leading-tight">
            Do problema à solução
            <br />
            <span className="text-[#E8682A]">em 3 passos</span>
          </h2>
          <p className="mt-6 text-lg text-[#4A4A4A] max-w-xl mx-auto leading-relaxed">
            Uma rede de proteção animal conectada, ágil e transparente.
            Cada denúncia gera uma corrente do bem.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.1 + i * 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative group"
            >
              <div
                className="relative bg-white rounded-3xl p-8 h-full overflow-hidden shadow-sm hover:shadow-xl transition-all duration-400 hover:-translate-y-1 cursor-default"
                style={{ borderTop: `3px solid ${step.accent}` }}
              >
                {/* Large number watermark */}
                <span
                  className="absolute -bottom-4 -right-2 text-[9rem] font-black leading-none select-none pointer-events-none"
                  style={{ color: step.accent, opacity: 0.06 }}
                  aria-hidden="true"
                >
                  {step.number}
                </span>

                {/* Icon */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: `${step.accent}12`, color: step.accent }}
                >
                  <step.Icon />
                </div>

                {/* Step number pill */}
                <span
                  className="inline-block text-xs font-black px-3 py-1 rounded-full mb-4"
                  style={{ background: `${step.accent}15`, color: step.accent }}
                >
                  PASSO {step.number}
                </span>

                <h3 className="text-xl font-black text-[#0A0A0A] mb-3">{step.title}</h3>
                <p className="text-[#555] leading-relaxed font-medium text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
