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
  const boxShadow = useTransform(
    scrollY,
    [0, 80],
    ["0 4px 24px rgba(0,0,0,0)", "0 4px 24px rgba(0,0,0,0.28)"]
  );

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50"
      style={{ backgroundColor: "#1B4332", boxShadow }}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 cursor-pointer flex-shrink-0">
          <Image
            src="/logorafael.png"
            alt="Eu Não Aceito Maus Tratos"
            width={68}
            height={68}
            style={{ objectFit: "contain" }}
          />
          <span className="hidden sm:flex flex-col leading-tight uppercase tracking-tight">
            <span className="font-bold text-white" style={{ fontSize: 16 }}>EU NÃO ACEITO</span>
            <span className="font-bold" style={{ fontSize: 17, color: "#d8610c" }}>MAUS TRATOS</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold transition-colors duration-200 cursor-pointer hover:text-white"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center">
          <Link
            href="#denunciar"
            className="text-sm font-bold text-white px-6 py-2.5 cursor-pointer transition-all duration-200 hover:brightness-110"
            style={{ backgroundColor: "#d8610c", borderRadius: 6 }}
          >
            DENUNCIAR
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
          className="md:hidden border-t border-white/10 px-6 py-4 flex flex-col gap-4"
          style={{ backgroundColor: "#1B4332" }}
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="font-semibold cursor-pointer hover:text-white transition-colors"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="#denunciar"
            className="font-bold text-white text-center py-2.5 cursor-pointer"
            style={{ backgroundColor: "#d8610c", borderRadius: 6 }}
            onClick={() => setMenuOpen(false)}
          >
            DENUNCIAR
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}
