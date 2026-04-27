"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const PAWS = [
  { top: "8%",  left: "5%",  size: 64, opacity: 0.04, rotate: -15 },
  { top: "20%", left: "88%", size: 80, opacity: 0.03, rotate: 20  },
  { top: "55%", left: "3%",  size: 40, opacity: 0.05, rotate: 10  },
  { top: "70%", left: "92%", size: 52, opacity: 0.04, rotate: -30 },
  { top: "38%", left: "50%", size: 28, opacity: 0.03, rotate: 5   },
  { top: "82%", left: "20%", size: 36, opacity: 0.05, rotate: -10 },
  { top: "12%", left: "40%", size: 22, opacity: 0.03, rotate: 25  },
  { top: "90%", left: "72%", size: 48, opacity: 0.04, rotate: 15  },
];

export function HeroSection() {
  return (
    <section
      id="hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#081a0f",
        overflow: "hidden",
      }}
    >
      {/* ── Aurora background ── */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: "-10px",
            opacity: 0.55,
            backgroundImage: [
              "repeating-linear-gradient(100deg, #081a0f 0%, #081a0f 7%, transparent 10%, transparent 12%, #081a0f 16%)",
              "repeating-linear-gradient(100deg, #1B4332 10%, #52B788 15%, #2D6A4F 20%, #d8610c 25%, #74c69d 30%)",
            ].join(", "),
            backgroundSize: "300%, 200%",
            backgroundPosition: "50% 50%, 50% 50%",
            filter: "blur(12px)",
            animation: "aurora 50s linear infinite",
          }}
        />
        {/* after-layer for depth */}
        <div
          style={{
            position: "absolute",
            inset: "-10px",
            opacity: 0.35,
            backgroundImage: [
              "repeating-linear-gradient(100deg, #081a0f 0%, #081a0f 7%, transparent 10%, transparent 12%, #081a0f 16%)",
              "repeating-linear-gradient(100deg, #d8610c 10%, #1B4332 15%, #52B788 20%, #0d2b1a 25%, #d8610c 30%)",
            ].join(", "),
            backgroundSize: "200%, 100%",
            backgroundPosition: "50% 50%, 50% 50%",
            filter: "blur(8px)",
            animation: "aurora 80s linear infinite reverse",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Vinheta nas bordas */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 75% at 50% 50%, transparent 35%, #081a0f 100%)",
      }} />

      {/* Grid sutil */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(82,183,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(82,183,136,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Patas decorativas */}
      {PAWS.map((p, i) => (
        <span key={i} style={{
          position: "absolute", top: p.top, left: p.left,
          fontSize: p.size, opacity: p.opacity,
          transform: `rotate(${p.rotate}deg)`,
          pointerEvents: "none", userSelect: "none", lineHeight: 1, zIndex: 1,
        }}>🐾</span>
      ))}

      {/* Conteúdo central */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", padding: "0 24px", maxWidth: 900,
      }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 18px", borderRadius: 20, marginBottom: 40,
            background: "rgba(216,97,12,0.12)",
            border: "1px solid rgba(216,97,12,0.35)",
            color: "#d8610c", fontSize: 13, fontWeight: 600,
          }}
        >
          <span>🧡</span>
          <span>Abril Laranja — Prevenção contra Maus Tratos a Animais</span>
        </motion.div>

        {/* Logotipo principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 28, filter: "drop-shadow(0 8px 40px rgba(216,97,12,0.30))" }}
        >
          <Image
            src="/logotipo.png"
            alt="Eu Não Aceito Maus Tratos"
            width={520}
            height={200}
            style={{
              width: "clamp(260px, 48vw, 520px)",
              height: "auto",
              objectFit: "contain",
            }}
            priority
          />
        </motion.div>

        {/* Linha decorativa */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 60 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          style={{ height: 3, background: "#d8610c", borderRadius: 2, marginBottom: 24 }}
        />

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)", fontWeight: 300,
            color: "rgba(255,255,255,0.65)", lineHeight: 1.6,
            marginBottom: 44, maxWidth: 560,
          }}
        >
          Seja a voz de quem não pode falar.<br />
          Denuncie, proteja, adote.
        </motion.p>

        {/* Botões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}
        >
          <Link
            href="#denunciar"
            style={{
              display: "inline-block", padding: "16px 36px",
              background: "#d8610c", color: "#fff", fontWeight: 700,
              fontSize: 15, borderRadius: 4, textDecoration: "none",
              transition: "filter 0.2s, transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.filter = "brightness(1.12)";
              el.style.transform = "scale(1.02)";
              el.style.boxShadow = "0 8px 32px rgba(216,97,12,0.45)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.filter = ""; el.style.transform = ""; el.style.boxShadow = "";
            }}
          >
            Denunciar Agora
          </Link>

          <Link
            href="#adocao"
            style={{
              display: "inline-block", padding: "16px 36px",
              background: "transparent", color: "#fff", fontWeight: 600,
              fontSize: 15, borderRadius: 4, textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.35)",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "rgba(255,255,255,0.9)";
              el.style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "rgba(255,255,255,0.35)";
              el.style.background = "transparent";
            }}
          >
            Adotar um Animal
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        style={{
          position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.2em",
          fontWeight: 600, zIndex: 10,
        }}
      >
        <span>ROLE PARA CONHECER</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: 18 }}
        >
          ↓
        </motion.span>
      </motion.div>
    </section>
  );
}
