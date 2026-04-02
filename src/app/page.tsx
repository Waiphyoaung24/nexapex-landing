import { BrandSection } from "@/components/BrandSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { ClientsSection } from "@/components/ClientsSection";
import { CTASection } from "@/components/CTASection";
import { FooterSection } from "@/components/FooterSection";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { Preloader } from "@/components/Preloader";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ThreeShowcase } from "@/components/ThreeShowcase";
import { ProjectShowcase } from "@/components/ui/project-showcase";

export default function Home() {
  return (
    <>
      <Preloader />
      <SmoothScroll />
      <Header />
      <main className="h-screen overflow-y-auto overflow-x-hidden">
        <HeroSection />
     
        <div id="three-showcase"><ThreeShowcase /></div>
        <div id="brand-section"><BrandSection /></div>
        <div id="clients-section"><ClientsSection /></div>
        <div id="project-showcase" className="bg-[#0e1418]">
          <ProjectShowcase />
        </div>
        <div id="capabilities-section"><CapabilitiesSection /></div>
        <div id="cta-section"><CTASection /></div>
        <FooterSection />
      </main>
    </>
  );
}
