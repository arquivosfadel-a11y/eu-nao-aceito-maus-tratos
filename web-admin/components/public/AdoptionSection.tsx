"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const mockAnimals = [
  {
    name: "Bolinha",
    species: "Cachorro",
    breed: "Vira-lata",
    age: "2 anos",
    city: "São Paulo, SP",
    photo: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop&auto=format",
    accent: "#d8610c",
  },
  {
    name: "Mimi",
    species: "Gato",
    breed: "Siamês",
    age: "1 ano",
    city: "Campinas, SP",
    photo: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop&auto=format",
    accent: "#52B788",
  },
  {
    name: "Thor",
    species: "Cachorro",
    breed: "Golden Retriever",
    age: "4 anos",
    city: "Ribeirão Preto, SP",
    photo: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=300&fit=crop&auto=format",
    accent: "#d8610c",
  },
  {
    name: "Mel",
    species: "Gato",
    breed: "Persa",
    age: "3 anos",
    city: "Sorocaba, SP",
    photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop&auto=format",
    accent: "#52B788",
  },
];

function AnimalCard({ animal, index, active }: { animal: typeof mockAnimals[0]; index: number; active: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.1 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: "1px solid #E8F0EC",
        boxShadow: "0 2px 12px rgba(27,67,50,0.06)",
        transition: "box-shadow 0.25s, transform 0.25s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px rgba(27,67,50,0.12)`;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(27,67,50,0.06)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Photo */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={animal.photo}
          alt={`${animal.name} para adoção`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Espécie badge */}
        <span
          className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: animal.accent }}
        >
          {animal.species}
        </span>

        {/* Disponível */}
        <span className="absolute top-3 right-3 bg-white text-[10px] font-bold px-2.5 py-1 rounded-full text-[#1B4332]">
          Disponível
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-black text-[#1B4332] text-base">{animal.name}</h3>
          <span className="text-xs text-gray-400 font-medium bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            {animal.age}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">{animal.breed}</p>

        <div className="flex items-center gap-1 text-gray-400 text-xs mb-4">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {animal.city}
        </div>

        <button
          className="w-full text-sm font-bold py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
          style={{ background: `${animal.accent}15`, color: animal.accent, border: `1.5px solid ${animal.accent}30` }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = animal.accent;
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            (e.currentTarget as HTMLButtonElement).style.borderColor = animal.accent;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = `${animal.accent}15`;
            (e.currentTarget as HTMLButtonElement).style.color = animal.accent;
            (e.currentTarget as HTMLButtonElement).style.borderColor = `${animal.accent}30`;
          }}
        >
          Tenho Interesse
        </button>
      </div>
    </motion.div>
  );
}

export function AdoptionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="adocao" className="py-28" style={{ background: "#F8FBF9" }} ref={ref}>
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[#52B788] text-xs font-bold tracking-widest uppercase mb-4">
            🐾 Adoção Responsável
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-[#1B4332] leading-tight mb-4">
            Eles precisam<br />
            <span style={{ color: "#52B788" }}>de você</span>
          </h2>
          <p className="text-base text-gray-400 max-w-md mx-auto leading-relaxed">
            Cada animal tem uma história e merece um lar cheio de amor.
            Encontre seu novo melhor amigo.
          </p>

          {/* Divisor */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="h-px w-12 bg-gray-200" />
            <span className="text-gray-300 text-lg">🐾</span>
            <div className="h-px w-12 bg-gray-200" />
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {mockAnimals.map((animal, i) => (
            <AnimalCard key={i} animal={animal} index={i} active={isInView} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="text-center"
        >
          <Link
            href="#"
            className="inline-block font-bold text-sm px-10 py-3.5 rounded-full transition-all duration-200 cursor-pointer"
            style={{
              border: "1.5px solid #52B788",
              color: "#52B788",
              background: "transparent",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#52B788";
              el.style.color = "#fff";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "transparent";
              el.style.color = "#52B788";
            }}
          >
            Ver Todos os Animais →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
