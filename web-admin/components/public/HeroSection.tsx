"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.13, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function HeroSection() {
  return (
    <section
      id="hero"
      className="flex flex-wrap min-h-screen"
      style={{ background: "#fff", paddingTop: 80 }}
    >
      {/* Left — text */}
      <div
        className="flex flex-col justify-center"
        style={{
          flex: "55 1 320px",
          padding: "80px 48px 80px 80px",
          minWidth: 0,
        }}
      >
        {/* Badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 20,
            marginBottom: 32,
            background: "rgba(216,97,12,0.10)",
            border: "1px solid rgba(216,97,12,0.3)",
            color: "#d8610c",
            fontSize: 13,
            fontWeight: 700,
            width: "fit-content",
          }}
        >
          <span>🧡</span>
          <span>ABRIL LARANJA 2026</span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.05, margin: 0 }}
        >
          <span style={{ color: "#1a1a1a" }}>EU NÃO</span>
          <br />
          <span style={{ color: "#d8610c" }}>ACEITO.</span>
        </motion.h1>

        {/* Animated line */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          style={{
            height: 3,
            background: "#d8610c",
            borderRadius: 2,
            marginTop: 20,
            marginBottom: 28,
          }}
        />

        {/* Subtitle */}
        <motion.p
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            fontSize: 16,
            fontWeight: 300,
            color: "#555",
            lineHeight: 1.7,
            marginBottom: 44,
            maxWidth: 460,
          }}
        >
          Seja a voz de quem não pode falar.<br />
          Registre denúncias, conecte protetores, salve vidas.
        </motion.p>

        {/* Buttons */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{ display: "flex", gap: 16, flexWrap: "wrap" }}
        >
          <Link
            href="#denunciar"
            className="transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
            style={{
              display: "inline-block",
              padding: "16px 36px",
              background: "#d8610c",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Denunciar Agora
          </Link>
          <Link
            href="#adocao"
            className="transition-all duration-200 hover:bg-[#1B4332]/5"
            style={{
              display: "inline-block",
              padding: "14px 36px",
              background: "transparent",
              color: "#1B4332",
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 8,
              textDecoration: "none",
              border: "2px solid #1B4332",
            }}
          >
            Adotar um Animal
          </Link>
        </motion.div>
      </div>

      {/* Right — logo */}
      <div
        className="flex flex-col items-center justify-center"
        style={{
          flex: "45 1 280px",
          background: "#F0F7F4",
          clipPath: "polygon(8% 0, 100% 0, 100% 100%, 0% 100%)",
          padding: "80px 48px",
          minWidth: 0,
        }}
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center"
          style={{ gap: 24 }}
        >
          <Image
            src="/logotipo.png"
            alt="Eu Não Aceito Maus Tratos"
            width={220}
            height={220}
            style={{ objectFit: "contain", width: 220, height: 220 }}
            priority
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 3,
              color: "#1B4332",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            EU NÃO ACEITO MAUS TRATOS
          </span>
        </motion.div>
      </div>
    </section>
  );
}
