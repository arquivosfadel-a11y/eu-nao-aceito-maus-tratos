import { Navbar } from "@/components/public/Navbar";
import { HeroSection } from "@/components/public/HeroSection";
import { StatsBar } from "@/components/public/StatsBar";
import { HowItWorks } from "@/components/public/HowItWorks";
import { StatsSection } from "@/components/public/StatsSection";
import { AdoptionSection } from "@/components/public/AdoptionSection";
import { CTASection } from "@/components/public/CTASection";
import { Footer } from "@/components/public/Footer";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <StatsSection />
      <AdoptionSection />
      <CTASection />
      <Footer />
    </main>
  );
}
