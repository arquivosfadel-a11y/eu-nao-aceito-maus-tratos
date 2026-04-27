"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function ImpactPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem("impact_popup_shown")) return;
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  function close() {
    setOpen(false);
    sessionStorage.setItem("impact_popup_shown", "1");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Por favor, insira seu nome."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("E-mail inválido."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8083"}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error("Erro ao cadastrar.");
      setSuccess(true);
      setTimeout(close, 2000);
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="relative w-full overflow-hidden"
            style={{ maxWidth: 480, borderRadius: 24, background: "#fff", boxShadow: "0 25px 80px rgba(0,0,0,0.45)" }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative flex flex-col items-center pt-8 pb-6 px-6" style={{ backgroundColor: "#1B4332" }}>
              <button
                onClick={close}
                aria-label="Fechar"
                className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 text-white"
                style={{ background: "rgba(255,255,255,0.2)", borderRadius: "50%", border: "none", cursor: "pointer" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              <div style={{ border: "2px solid rgba(216,97,12,0.6)", borderRadius: 16, display: "inline-block", marginBottom: 16 }}>
                <Image src="/logo.png" alt="Logo" width={80} height={80} style={{ borderRadius: 16, display: "block" }} />
              </div>

              <h2 className="text-center font-black" style={{ fontSize: 22, lineHeight: 1.2 }}>
                <span className="text-white">Todo dia,</span>{" "}
                <span style={{ color: "#d8610c" }}>um animal sofre.</span>
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Impact card */}
              <div
                className="text-sm leading-relaxed"
                style={{
                  background: "#FFF5F0",
                  borderLeft: "4px solid #d8610c",
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "#444",
                }}
              >
                No Brasil, <strong style={{ color: "#d8610c" }}>30 milhões</strong> de animais vivem em situação de rua.
                A cada <strong style={{ color: "#d8610c" }}>60 segundos</strong>, um animal é vítima de maus tratos —
                e <strong style={{ color: "#d8610c" }}>80%</strong> dos casos nunca são denunciados.
              </div>

              {/* Mini stats */}
              <div className="flex gap-3">
                {[
                  { value: "30M", label: "animais em situação de rua" },
                  { value: "1/60s", label: "caso de maus tratos" },
                  { value: "80%", label: "nunca denunciados" },
                ].map((stat) => (
                  <div
                    key={stat.value}
                    className="flex-1 flex flex-col items-center text-center"
                    style={{ background: "#F0F7F4", borderRadius: 10, padding: "10px 6px" }}
                  >
                    <span className="font-black text-base" style={{ color: "#1B4332" }}>{stat.value}</span>
                    <span className="text-xs text-gray-500 mt-0.5 leading-tight">{stat.label}</span>
                  </div>
                ))}
              </div>

              {success ? (
                <div
                  className="text-center font-bold py-4 rounded-xl"
                  style={{ background: "#F0F7F4", color: "#1B4332" }}
                >
                  Obrigado! Você receberá nossas atualizações 🐾
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <p className="text-sm text-gray-600">
                    Receba atualizações da causa, histórias de resgate e como você pode ajudar:
                  </p>

                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      border: "1.5px solid #E0E0E0",
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontSize: 14,
                      outline: "none",
                      width: "100%",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#52B788")}
                    onBlur={(e) => (e.target.style.borderColor = "#E0E0E0")}
                  />

                  <input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      border: "1.5px solid #E0E0E0",
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontSize: 14,
                      outline: "none",
                      width: "100%",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#52B788")}
                    onBlur={(e) => (e.target.style.borderColor = "#E0E0E0")}
                  />

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: "#d8610c",
                      color: "#fff",
                      fontWeight: 700,
                      height: 48,
                      borderRadius: 10,
                      width: "100%",
                      border: "none",
                      fontSize: 15,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.8 : 1,
                    }}
                  >
                    {loading ? "Enviando..." : "Quero fazer parte da causa 🐾"}
                  </button>

                  <button
                    type="button"
                    onClick={close}
                    className="text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    Agora não, obrigado
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
