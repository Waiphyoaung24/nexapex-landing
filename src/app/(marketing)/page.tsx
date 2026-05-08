import { BrandSection } from "@/components/BrandSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { ClientsSection } from "@/components/ClientsSection";
import { EditorialHighlightSection } from "@/components/EditorialHighlightSection";
import { ShipStackSection } from "@/components/ShipStackSection";
import { CTASection } from "@/components/CTASection";
import { FooterSection } from "@/components/FooterSection";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { InterstitialCanvas } from "@/components/InterstitialCanvas";
import { Preloader } from "@/components/Preloader";
import { ProjectShowcase } from "@/components/ui/project-showcase";

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
          <EditorialHighlightSection id="practice-section" />
          <ShipStackSection id="delivery-section" />
          <ClientsSection id="clients-section" />
          <div id="project-showcase" className="bg-[#0e1418] min-h-screen flex items-center">
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
