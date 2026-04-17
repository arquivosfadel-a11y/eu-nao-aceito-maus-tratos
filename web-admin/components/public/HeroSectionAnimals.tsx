"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const STATS = [
  {
    value: "1.2k+",
    label: "Animais salvos",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 11c1.381 0 2.5-1.567 2.5-3.5S5.881 4 4.5 4 2 5.567 2 7.5 3.119 11 4.5 11zm15 0c1.381 0 2.5-1.567 2.5-3.5S20.881 4 19.5 4 17 5.567 17 7.5 18.119 11 19.5 11zM8.5 9C9.881 9 11 7.433 11 5.5S9.881 2 8.5 2 6 3.567 6 5.5 7.119 9 8.5 9zm7 0C16.881 9 18 7.433 18 5.5S16.881 2 15.5 2 13 3.567 13 5.5 14.119 9 15.5 9zM12 11c-3.53 0-8 2.608-8 5.399 0 3.537 2.989 5.906 8 5.906s8-2.369 8-5.906C20 13.608 15.53 11 12 11z" />
      </svg>
    ),
  },
  {
    value: "340",
    label: "Adotados",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    value: "80",
    label: "Protetores ativos",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
    ),
  },
];

const IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80",
    alt: "Pessoa cuidando de cachorro resgatado",
    className: "absolute top-0 right-0 w-[60%] h-[55%] rounded-3xl object-cover shadow-2xl",
  },
  {
    src: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=80",
    alt: "Filhote de cachorro resgatado",
    className: "absolute bottom-0 right-[10%] w-[50%] h-[48%] rounded-3xl object-cover shadow-2xl",
  },
  {
    src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80",
    alt: "Dois cachorros resgatados felizes",
    className: "absolute top-[28%] left-0 w-[44%] h-[45%] rounded-3xl object-cover shadow-2xl",
  },
];

const floatingPaws = [
  { x: "10%", y: "8%", size: 28, duration: 7, delay: 0 },
  { x: "85%", y: "15%", size: 20, duration: 9, delay: 1.5 },
  { x: "5%",  y: "70%", size: 24, duration: 8, delay: 0.8 },
  { x: "92%", y: "75%", size: 18, duration: 10, delay: 2.2 },
  { x: "50%", y: "5%",  size: 16, duration: 6,  delay: 1.1 },
];

export function HeroSectionAnimals() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      id="impacto"
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ backgroundColor: "#F0F7F4" }}
    >
      {/* Floating paw SVGs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {floatingPaws.map((p, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: p.x, top: p.y, opacity: 0.07, color: "#1B4332" }}
            animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg
              width={p.size}
              height={p.size}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4.5 11c1.381 0 2.5-1.567 2.5-3.5S5.881 4 4.5 4 2 5.567 2 7.5 3.119 11 4.5 11zm15 0c1.381 0 2.5-1.567 2.5-3.5S20.881 4 19.5 4 17 5.567 17 7.5 18.119 11 19.5 11zM8.5 9C9.881 9 11 7.433 11 5.5S9.881 2 8.5 2 6 3.567 6 5.5 7.119 9 8.5 9zm7 0C16.881 9 18 7.433 18 5.5S16.881 2 15.5 2 13 3.567 13 5.5 14.119 9 15.5 9zM12 11c-3.53 0-8 2.608-8 5.399 0 3.537 2.989 5.906 8 5.906s8-2.369 8-5.906C20 13.608 15.53 11 12 11z" />
            </svg>
          </motion.div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full tracking-widest uppercase"
                style={{
                  background: "rgba(216, 97, 12, 0.1)",
                  border: "1px solid rgba(216, 97, 12, 0.25)",
                  color: "#d8610c",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "#d8610c", animation: "pulse 2s ease-in-out infinite" }}
                />
                Plataforma ativa agora
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-black text-5xl sm:text-6xl leading-[1.05] mb-6"
            >
              <span style={{ color: "#1B4332" }}>Seja a voz</span>
              <br />
              <span style={{ color: "#d8610c" }}>de quem não pode falar</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg leading-relaxed mb-10 max-w-lg"
              style={{ color: "#1B4332", opacity: 0.65 }}
            >
              Registre denúncias de maus tratos, acompanhe os casos e ajude animais a encontrar um lar. Rápido, gratuito e anônimo.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 font-extrabold py-4 px-8 rounded-full text-base transition-all duration-200 cursor-pointer shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
                style={{
                  background: "#d8610c",
                  color: "#fff",
                  boxShadow: "0 8px 24px rgba(216, 97, 12, 0.35)",
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                Fazer uma Denúncia
              </Link>
              <Link
                href="#adocao"
                className="inline-flex items-center justify-center gap-2 font-extrabold py-4 px-8 rounded-full text-base transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:opacity-90"
                style={{ background: "#1B4332", color: "#fff" }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                </svg>
                Adotar um Animal
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap gap-6"
            >
              {STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(27, 67, 50, 0.1)", color: "#1B4332" }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="font-black text-xl leading-none" style={{ color: "#1B4332" }}>
                      {stat.value}
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "#1B4332", opacity: 0.55 }}>
                      {stat.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right — photo collage */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[480px] lg:h-[560px] hidden md:block"
          >
            {IMAGES.map((img, i) => (
              <motion.img
                key={i}
                src={img.src}
                alt={img.alt}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.03, zIndex: 10, transition: { duration: 0.25 } }}
                className={img.className}
              />
            ))}

            {/* Green accent ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.6 }}
              className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full pointer-events-none"
              style={{
                border: "3px solid rgba(82, 183, 136, 0.4)",
              }}
            />

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="absolute bottom-12 left-[-8%] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-none"
              style={{
                background: "#1B4332",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#d8610c" }}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm leading-none">Novo resgate</p>
                <p className="text-white/50 text-xs mt-0.5">há 3 minutos</p>
              </div>
              <span className="ml-1 relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
