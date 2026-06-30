import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/ui/Marquee";
import { HowItWorks } from "@/components/HowItWorks";
import { SecuritySection } from "@/components/SecuritySection";
import { CodeShowcase } from "@/components/CodeShowcase";
import { CTA } from "@/components/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <HowItWorks />
      <SecuritySection />
      <CodeShowcase />
      <CTA />
    </>
  );
}
