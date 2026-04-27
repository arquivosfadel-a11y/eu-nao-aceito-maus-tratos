"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

const NAV_LINKS = [
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Adoção", href: "#adocao" },
  { label: "Painel Admin", href: "/login" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.95]);
  const shadowOpacity = useTransform(scrollY, [0, 80], [0, 0.25]);
  const blurAmount = useTransform(scrollY, [0, 80], [0, 12]);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50"
      style={{
        backdropFilter: useTransform(blurAmount, (v) => `blur(${v}px)`),
        backgroundColor: useTransform(bgOpacity, (v) => `rgba(27, 67, 50, ${v})`),
        boxShadow: useTransform(shadowOpacity, (v) => `0 4px 24px rgba(0,0,0,${v})`),
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Eu Não Aceito Maus Tratos"
            width={52}
            height={52}
            style={{ borderRadius: 10 }}
          />
          <span className="hidden sm:flex flex-col leading-tight uppercase tracking-tight">
            <span className="font-bold text-white" style={{ fontSize: 14 }}>EU NÃO ACEITO</span>
            <span className="font-bold" style={{ fontSize: 16, color: "#d8610c" }}>MAUS TRATOS</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-white/80 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA Button — Denunciar with pulse */}
        <div className="hidden md:flex items-center">
          <Link
            href="#denunciar"
            className="relative text-sm font-extrabold text-white px-6 py-2.5 rounded-full cursor-pointer overflow-hidden"
            style={{ backgroundColor: "#d8610c" }}
          >
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: "#d8610c" }}
              aria-hidden="true"
            />
            <span className="relative z-10">Denunciar</span>
          </Link>
        </div>

        {/* Mobile hamburger */}
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

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#1B4332]/98 border-t border-white/10 px-6 py-4 flex flex-col gap-4"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="text-white/80 font-semibold cursor-pointer hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="#denunciar"
            className="font-extrabold text-white text-center py-2.5 rounded-full cursor-pointer"
            style={{ backgroundColor: "#d8610c" }}
            onClick={() => setMenuOpen(false)}
          >
            Denunciar
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}
