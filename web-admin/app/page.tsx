import { Navbar } from "@/components/public/Navbar";
import { IntroAnimation } from "@/components/public/IntroAnimation";
import { HeroSectionAnimals } from "@/components/public/HeroSectionAnimals";
import { HowItWorks } from "@/components/public/HowItWorks";
import { StatsSection } from "@/components/public/StatsSection";
import { AdoptionSection } from "@/components/public/AdoptionSection";
import { CTASection } from "@/components/public/CTASection";
import { Footer } from "@/components/public/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Navbar sobreposta — transparente no topo, verde no scroll */}
      <Navbar />

      {/* Seção 1 — Hero animado com cartas */}
      <IntroAnimation />

      {/* Seção 2 — Collage de impacto com stats */}
      <HeroSectionAnimals />

      {/* Seção 3 — Como Funciona */}
      <HowItWorks />

      {/* Seção 4 — Números chocantes */}
      <StatsSection />

      {/* Seção 5 — Adoção */}
      <AdoptionSection />

      {/* Seção 6 — CTA Final */}
      <CTASection />

      {/* Seção 7 — Footer */}
      <Footer />
    </main>
  );
}
