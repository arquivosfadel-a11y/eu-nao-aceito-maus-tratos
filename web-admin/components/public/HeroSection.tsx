"use client";

import { useEffect, useRef } from "react";
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

function ParticlesCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const pts = Array.from({ length: 90 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r:  Math.random() * 1.4 + 0.4,
      hue: Math.random() > 0.7 ? "82,183,136" : "255,255,255",
    }));

    let id: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},0.5)`;
        ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(82,183,136,${0.06 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

const wordReveal = {
  hidden: { clipPath: "inset(100% 0% 0% 0%)", opacity: 0 },
  visible: { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 },
};

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
        background: "linear-gradient(160deg, #0a1f12 0%, #1B4332 50%, #0d2b1a 100%)",
        overflow: "hidden",
      }}
    >
      <ParticlesCanvas />

      {/* Grid sutil */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Vinheta */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 40%, #0a1f12 100%)",
      }} />

      {/* Glow laranja canto superior direito */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: 420, height: 420,
        background: "radial-gradient(circle, rgba(216,97,12,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Linha horizontal sutil */}
      <div style={{
        position: "absolute", top: "58%", left: 0, right: 0, height: 1,
        background: "rgba(82,183,136,0.08)", pointerEvents: "none",
      }} />

      {/* Patas decorativas */}
      {PAWS.map((p, i) => (
        <span key={i} style={{
          position: "absolute", top: p.top, left: p.left,
          fontSize: p.size, opacity: p.opacity,
          transform: `rotate(${p.rotate}deg)`,
          pointerEvents: "none", userSelect: "none", lineHeight: 1,
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
          style={{ marginBottom: 28, filter: "drop-shadow(0 8px 32px rgba(216,97,12,0.25))" }}
        >
          <Image
            src="/logotipo.png"
            alt="Eu Não Aceito Maus Tratos"
            width={520}
            height={200}
            style={{
              width: "clamp(280px, 50vw, 520px)",
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
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          style={{ height: 3, background: "#d8610c", borderRadius: 2, marginBottom: 24 }}
        />

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)", fontWeight: 300,
            color: "rgba(255,255,255,0.6)", lineHeight: 1.6,
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
          transition={{ duration: 0.7, delay: 0.8 }}
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
              el.style.boxShadow = "0 8px 32px rgba(216,97,12,0.4)";
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
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.35)"; }}
          >
            Adotar um Animal
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
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
