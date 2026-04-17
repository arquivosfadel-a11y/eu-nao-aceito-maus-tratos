"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const IMAGES = [
  { src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=80", alt: "Cachorro feliz" },
  { src: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&q=80", alt: "Cachorro sorrindo" },
  { src: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=300&q=80", alt: "Cão e gato juntos" },
  { src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&q=80", alt: "Dois cachorros" },
  { src: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=300&q=80", alt: "Cachorro sorrindo feliz" },
  { src: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=300&q=80", alt: "Filhote adorável" },
  { src: "https://images.unsplash.com/photo-1589952283406-b53a7d1347e8?w=300&q=80", alt: "Gato fofo" },
  { src: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=300&q=80", alt: "Gato curioso" },
  { src: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&q=80", alt: "Gato com olhos grandes" },
  { src: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=300&q=80", alt: "Gato laranja" },
  { src: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&q=80", alt: "Pessoa cuidando de cachorro" },
  { src: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=300&q=80", alt: "Pessoa abraçando gato" },
  { src: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=300&q=80", alt: "Cachorro na natureza" },
  { src: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&q=80", alt: "Filhote de cachorro" },
  { src: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=300&q=80", alt: "Gato preto elegante" },
  { src: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=300&q=80", alt: "Gato branco fofo" },
  { src: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=300&q=80", alt: "Cachorro golden retriever" },
  { src: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&q=80", alt: "Cachorro husky" },
  { src: "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=300&q=80", alt: "Filhote super fofo" },
  { src: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=300&q=80", alt: "Cachorro na grama" },
];

const CARD_POSITIONS = [
  { x: "-42%", y: "-38%", rotate: -14, w: 140, h: 105 },
  { x: "-18%", y: "-44%", rotate: 6,  w: 120, h: 90  },
  { x:  "8%",  y: "-40%", rotate: -4, w: 150, h: 112 },
  { x:  "34%", y: "-36%", rotate: 11, w: 130, h: 98  },
  { x:  "48%", y: "-22%", rotate: -8, w: 118, h: 88  },
  { x: "-48%", y: "-8%",  rotate: 9,  w: 135, h: 101 },
  { x: "-30%", y: "12%",  rotate: -6, w: 125, h: 94  },
  { x: "-10%", y: "-18%", rotate: 3,  w: 145, h: 109 },
  { x:  "14%", y: "-14%", rotate: -10,w: 122, h: 92  },
  { x:  "38%", y: "6%",   rotate: 7,  w: 138, h: 104 },
  { x:  "50%", y: "18%",  rotate: -5, w: 116, h: 87  },
  { x: "-44%", y: "28%",  rotate: 12, w: 142, h: 107 },
  { x: "-22%", y: "34%",  rotate: -9, w: 128, h: 96  },
  { x:  "2%",  y: "30%",  rotate: 5,  w: 152, h: 114 },
  { x:  "24%", y: "26%",  rotate: -13,w: 120, h: 90  },
  { x:  "44%", y: "36%",  rotate: 8,  w: 132, h: 99  },
  { x: "-36%", y: "48%",  rotate: -7, w: 124, h: 93  },
  { x: "-12%", y: "46%",  rotate: 4,  w: 148, h: 111 },
  { x:  "16%", y: "50%",  rotate: -11,w: 126, h: 95  },
  { x:  "40%", y: "52%",  rotate: 10, w: 136, h: 102 },
];

export function IntroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), 300);
    const t2 = setTimeout(() => setTextVisible(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden" style={{ backgroundColor: "#F0F7F4" }}>
      <motion.div
        style={{ opacity: bgOpacity, backgroundColor: "#F0F7F4" }}
        className="absolute inset-0"
      />

      {/* Cards scattered */}
      <motion.div style={{ y: contentY }} className="absolute inset-0 flex items-center justify-center">
        {IMAGES.map((img, i) => {
          const pos = CARD_POSITIONS[i];
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.7 }}
              animate={
                revealed
                  ? {
                      x: pos.x,
                      y: pos.y,
                      rotate: pos.rotate,
                      opacity: 1,
                      scale: 1,
                    }
                  : {}
              }
              transition={{
                duration: 1.1,
                delay: 0.04 * i,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ scale: 1.08, rotate: 0, zIndex: 50, transition: { duration: 0.2 } }}
              className="absolute cursor-pointer"
              style={{
                width: pos.w,
                height: pos.h,
                zIndex: i,
              }}
            >
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl ring-2 ring-white/70">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover"
                  loading={i < 4 ? "eager" : "lazy"}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Central frosted card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={textVisible ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
      >
        <div
          className="text-center px-8 py-10 rounded-3xl max-w-xl mx-4"
          style={{
            background: "rgba(240, 247, 244, 0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1.5px solid rgba(27, 67, 50, 0.12)",
            boxShadow: "0 24px 64px rgba(27, 67, 50, 0.14)",
          }}
        >
          {/* Logo paw */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={textVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "#1B4332" }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4.5 11c1.381 0 2.5-1.567 2.5-3.5S5.881 4 4.5 4 2 5.567 2 7.5 3.119 11 4.5 11zm15 0c1.381 0 2.5-1.567 2.5-3.5S20.881 4 19.5 4 17 5.567 17 7.5 18.119 11 19.5 11zM8.5 9C9.881 9 11 7.433 11 5.5S9.881 2 8.5 2 6 3.567 6 5.5 7.119 9 8.5 9zm7 0C16.881 9 18 7.433 18 5.5S16.881 2 15.5 2 13 3.567 13 5.5 14.119 9 15.5 9zM12 11c-3.53 0-8 2.608-8 5.399 0 3.537 2.989 5.906 8 5.906s8-2.369 8-5.906C20 13.608 15.53 11 12 11z" />
              </svg>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={textVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="font-black text-3xl sm:text-4xl leading-tight mb-3"
            style={{ color: "#1B4332" }}
          >
            Cada animal merece
            <br />
            <span style={{ color: "#d8610c" }}>amor e proteção.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={textVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm sm:text-base font-medium leading-relaxed"
            style={{ color: "#1B4332", opacity: 0.7 }}
          >
            Juntos pela Causa Animal
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={textVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-3 text-xs font-medium leading-relaxed max-w-xs mx-auto"
            style={{ color: "#1B4332", opacity: 0.5 }}
          >
            Milhares de animais precisam de você. Denuncie maus tratos, adote e faça parte dessa corrente de amor e proteção.
          </motion.p>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={textVisible ? { opacity: 1 } : {}}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2 z-50 pointer-events-none"
      >
        <span
          className="text-[10px] font-bold tracking-[0.25em] uppercase"
          style={{ color: "#1B4332", opacity: 0.45 }}
        >
          ROLE PARA CONHECER
        </span>
        <div
          className="w-5 h-9 rounded-full flex justify-center pt-1.5"
          style={{ border: "1.5px solid rgba(27,67,50,0.25)" }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-1 h-1 rounded-full"
            style={{ background: "#d8610c" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
