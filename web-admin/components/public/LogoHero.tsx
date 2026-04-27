"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function LogoHero() {
  return (
    <>
      <section
        style={{ background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)" }}
        className="w-full pt-28 pb-16 px-6 flex flex-col items-center"
      >
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-10 max-w-3xl w-full"
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div
            variants={{ hidden: { x: -60, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                border: "3px solid rgba(216,97,12,0.5)",
                borderRadius: 24,
                display: "inline-block",
              }}
            >
              <Image
                src="/logo.png"
                alt="Eu Não Aceito Maus Tratos"
                width={160}
                height={160}
                style={{ borderRadius: 24, display: "block" }}
              />
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            className="flex flex-col items-center md:items-start text-center md:text-left"
            variants={{ hidden: { x: 60, opacity: 0 }, visible: { x: 0, opacity: 1 } }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          >
            <span
              className="text-white uppercase leading-none"
              style={{ fontSize: 42, fontWeight: 900 }}
            >
              EU NÃO ACEITO
            </span>
            <span
              className="uppercase leading-none"
              style={{ fontSize: 48, fontWeight: 900, color: "#d8610c" }}
            >
              MAUS TRATOS
            </span>
            <p className="mt-4 text-white/80" style={{ fontSize: 16 }}>
              Plataforma nacional de denúncias e adoção de animais
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Faixa Abril Laranja */}
      <div
        className="w-full text-center text-white font-bold"
        style={{ backgroundColor: "#d8610c", fontSize: 13, padding: "8px 16px" }}
      >
        🧡 Abril Laranja — Mês de Prevenção contra Maus Tratos a Animais
      </div>
    </>
  );
}
