import { BrandSection } from "@/components/BrandSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { ClientsSection } from "@/components/ClientsSection";
import { EditorialHighlightSection } from "@/components/EditorialHighlightSection";
import { ShipStackSection } from "@/components/ShipStackSection";
import { CTASection } from "@/components/CTASection";
import { FooterSection } from "@/components/FooterSection";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { InterstitialBreathe } from "@/components/InterstitialBreathe";
import { InterstitialCanvas } from "@/components/InterstitialCanvas";
import { Preloader } from "@/components/Preloader";
import { ProjectShowcase } from "@/components/ui/project-showcase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NexApex — Applied AI for Southeast Asia",
  description: "We design, build, and ship AI-native products for ambitious teams across Southeast Asia.",
};

export default function Home() {
  return (
    <>
      <Preloader />
      <Header />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <HeroSection />
          <InterstitialCanvas id="interstitial-canvas" />
          <BrandSection id="brand-section" />
          <InterstitialBreathe id="breathe-section" />
          <EditorialHighlightSection id="practice-section" />
          <ShipStackSection id="delivery-section" />
          <ClientsSection id="clients-section" />
          <div id="project-showcase" className="bg-nex-background min-h-screen flex items-center">
            <ProjectShowcase />
          </div>
          <CapabilitiesSection id="capabilities-section" />
          <CTASection id="cta-section" />
          <FooterSection />
        </div>
      </div>
    </>
  );
}
