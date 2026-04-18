"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { ParticlesPaws } from "./ParticlesPaws";

const TITLE_WORDS_WHITE = ["Seja", "a", "voz"];
const TITLE_WORDS_ORANGE = ["de", "quem", "não", "pode", "falar."];

const PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80",
    alt: "Cachorro resgatado olhando para a câmera",
    large: true,
  },
  {
    src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80",
    alt: "Cão feliz após resgate",
    large: false,
  },
  {
    src: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&q=80",
    alt: "Gato em lar temporário",
    large: false,
  },
];

function PhotoGrid() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [6, -6]), { stiffness: 120, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-6, 6]), { stiffness: 120, damping: 20 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseX.set(e.clientX - cx);
    mouseY.set(e.clientY - cy);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      className="grid grid-cols-2 grid-rows-2 gap-3 h-[520px] lg:h-[580px]"
      style={{ rotateX, rotateY, perspective: 1200, transformStyle: "preserve-3d" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Large photo — spans 2 rows left column */}
      <div className="row-span-2 relative overflow-hidden rounded-[20px] shadow-2xl shadow-black/40">
        <Image
          src={PHOTOS[0].src}
          alt={PHOTOS[0].alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 45vw, 280px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Small photo top-right */}
      <div className="relative overflow-hidden rounded-[20px] shadow-xl shadow-black/30">
        <Image
          src={PHOTOS[1].src}
          alt={PHOTOS[1].alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 45vw, 200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Small photo bottom-right */}
      <div className="relative overflow-hidden rounded-[20px] shadow-xl shadow-black/30">
        <Image
          src={PHOTOS[2].src}
          alt={PHOTOS[2].alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 45vw, 200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)" }}
    >
      {/* Paw particles background */}
      <ParticlesPaws />

      {/* Subtle radial overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* ── Left: Text (55%) ── */}
          <div className="flex-1 lg:w-[55%] flex flex-col items-start">

            {/* Badge — Abril Laranja */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <span
                className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2 rounded-full uppercase tracking-widest relative overflow-hidden"
                style={{
                  background: "linear-gradient(90deg, rgba(216,97,12,0.18) 0%, rgba(244,162,97,0.18) 100%)",
                  border: "1px solid rgba(216,97,12,0.35)",
                  color: "#F4A261",
                }}
              >
                {/* Shimmer */}
                <span
                  className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite]"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
                  aria-hidden="true"
                />
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                  style={{ backgroundColor: "#d8610c" }}
                  aria-hidden="true"
                />
                Abril Laranja — Mês de Prevenção contra Maus Tratos
              </span>
            </motion.div>

            {/* Title with word-by-word stagger reveal */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                {TITLE_WORDS_WHITE.map((word, i) => (
                  <div key={word + i} className="overflow-hidden">
                    <motion.span
                      className="block text-white font-black"
                      style={{ fontSize: "clamp(48px, 6vw, 72px)", lineHeight: 1.05 }}
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 0.65, delay: 0.25 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {word}
                    </motion.span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {TITLE_WORDS_ORANGE.map((word, i) => (
                  <div key={word + i} className="overflow-hidden">
                    <motion.span
                      className="block font-black"
                      style={{ fontSize: "clamp(48px, 6vw, 72px)", lineHeight: 1.05, color: "#d8610c" }}
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 0.65, delay: 0.55 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {word}
                    </motion.span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1 }}
              className="text-lg font-medium mb-10 max-w-lg"
              style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.65 }}
            >
              Cada denúncia salva uma vida. Registre maus tratos a animais e conecte com protetores verificados na sua região.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              {/* Primary — Denunciar with pulse */}
              <Link
                href="#denunciar"
                className="relative flex items-center justify-center gap-2 font-extrabold text-white py-4 px-9 rounded-full text-base cursor-pointer overflow-hidden transition-transform duration-200 hover:scale-[1.03] active:scale-100"
                style={{ backgroundColor: "#d8610c", boxShadow: "0 8px 32px rgba(216,97,12,0.4)" }}
              >
                <span
                  className="absolute inset-0 rounded-full animate-ping opacity-25"
                  style={{ backgroundColor: "#d8610c" }}
                  aria-hidden="true"
                />
                <svg className="w-5 h-5 relative z-10 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="relative z-10">Denunciar Agora</span>
              </Link>

              {/* Secondary — Adotar */}
              <Link
                href="#adocao"
                className="flex items-center justify-center gap-2 font-extrabold text-white py-4 px-9 rounded-full text-base cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-100"
                style={{ border: "2px solid rgba(255,255,255,0.3)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#52B788";
                  e.currentTarget.style.background = "rgba(82,183,136,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Adotar um Animal
              </Link>
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.5 }}
              className="flex flex-wrap gap-6 text-xs font-bold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {["100% Gratuito", "Anônimo", "Protetores Verificados"].map((label) => (
                <span key={label} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#d8610c" }} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Photos (45%) ── */}
          <div className="hidden lg:block lg:w-[45%]">
            <PhotoGrid />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 14, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "#d8610c" }}
          />
        </div>
        <span className="text-white/30 text-xs font-semibold tracking-widest uppercase">Rolar</span>
      </motion.div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(200%); }
        }
      `}</style>
    </section>
  );
}
