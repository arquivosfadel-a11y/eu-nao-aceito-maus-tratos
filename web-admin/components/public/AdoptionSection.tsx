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
    badgeColor: "#E8682A",
  },
  {
    name: "Mimi",
    species: "Gato",
    breed: "Siamês",
    age: "1 ano",
    city: "Campinas, SP",
    photo: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop&auto=format",
    badgeColor: "#52B788",
  },
  {
    name: "Thor",
    species: "Cachorro",
    breed: "Golden Retriever",
    age: "4 anos",
    city: "Ribeirão Preto, SP",
    photo: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&h=300&fit=crop&auto=format",
    badgeColor: "#E8682A",
  },
  {
    name: "Mel",
    species: "Gato",
    breed: "Persa",
    age: "3 anos",
    city: "Sorocaba, SP",
    photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop&auto=format",
    badgeColor: "#52B788",
  },
];

function AnimalCard({
  animal,
  index,
  active,
}: {
  animal: (typeof mockAnimals)[0];
  index: number;
  active: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: 0.1 + index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-[#111] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
      style={{
        ["--tw-shadow-color" as string]: "#E8682A33",
      }}
    >
      {/* Photo */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={animal.photo}
          alt={`${animal.name} — ${animal.species} para adoção`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Available badge */}
        <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
          Disponível
        </div>

        {/* Species badge */}
        <div
          className="absolute top-3 left-3 text-white text-xs font-black px-3 py-1 rounded-full"
          style={{ backgroundColor: animal.badgeColor }}
        >
          {animal.species}
        </div>
      </div>

      {/* Card hover orange glow border */}
      <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[#E8682A]/40 transition-colors duration-300 pointer-events-none" />

      {/* Info */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-black text-lg">{animal.name}</h3>
          <span className="text-white/50 text-xs font-semibold bg-white/10 px-2.5 py-1 rounded-full">{animal.age}</span>
        </div>
        <p className="text-white/50 text-sm font-medium mb-3">{animal.breed}</p>

        <div className="flex items-center gap-1.5 text-white/40 text-xs font-medium mb-4">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {animal.city}
        </div>

        <button
          className="w-full font-bold py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer"
          style={{ background: `${animal.badgeColor}20`, color: animal.badgeColor, border: `1px solid ${animal.badgeColor}40` }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = animal.badgeColor;
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = `${animal.badgeColor}20`;
            (e.currentTarget as HTMLButtonElement).style.color = animal.badgeColor;
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
    <section id="adocao" className="py-28 bg-[#0A0A0A]" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block bg-[#52B788]/10 border border-[#52B788]/25 text-[#52B788] text-xs font-bold px-5 py-2 rounded-full mb-6 tracking-widest uppercase">
            Adoção Responsável
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
            Eles precisam
            <br />
            <span className="text-[#52B788]">de você</span>
          </h2>
          <p className="mt-6 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            Cada animal tem uma história e merece um lar cheio de amor.
            Encontre seu novo melhor amigo.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {mockAnimals.map((animal, i) => (
            <AnimalCard key={i} animal={animal} index={i} active={isInView} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center"
        >
          <Link
            href="#"
            className="inline-block border-2 border-[#52B788]/40 hover:border-[#52B788] hover:bg-[#52B788]/10 text-[#52B788] font-extrabold py-4 px-12 rounded-full text-lg transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
          >
            Ver Todos os Animais
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
