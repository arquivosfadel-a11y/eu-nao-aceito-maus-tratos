"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll } from "framer-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#1B4332]/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <Image
              src="/logo.png"
              alt="Eu Não Aceito Maus Tratos"
              width={38}
              height={38}
              className="rounded-full"
            />
          </div>
          <span className="font-black text-white text-sm leading-tight hidden sm:block">
            Eu Não Aceito<br />
            <span className="text-[#F4A261]">Maus Tratos</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Denunciar", href: "#como-funciona" },
            { label: "Como Funciona", href: "#como-funciona" },
            { label: "Adoção", href: "#adocao" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-white/80 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm font-bold bg-[#E8682A] hover:bg-[#F4A261] text-black px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-md hover:shadow-[#E8682A]/40 hover:shadow-lg"
          >
            Painel Admin
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
          className="md:hidden p-2 text-white cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#1B4332]/98 border-t border-white/10 px-6 py-4 flex flex-col gap-4"
        >
          <Link href="#como-funciona" onClick={() => setMenuOpen(false)} className="text-white/80 font-semibold cursor-pointer">Como Funciona</Link>
          <Link href="#numeros" onClick={() => setMenuOpen(false)} className="text-white/80 font-semibold cursor-pointer">Impacto</Link>
          <Link href="#adocao" onClick={() => setMenuOpen(false)} className="text-white/80 font-semibold cursor-pointer">Adoção</Link>
          <Link href="/login" className="bg-[#E8682A] text-black font-bold px-5 py-2.5 rounded-full text-center cursor-pointer">Painel Admin</Link>
        </motion.div>
      )}
    </motion.nav>
  );
}
