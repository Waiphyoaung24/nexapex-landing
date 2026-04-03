import { BrandSection } from "@/components/BrandSection";
import { CapabilitiesSection } from "@/components/CapabilitiesSection";
import { ClientsSection } from "@/components/ClientsSection";
import { CTASection } from "@/components/CTASection";
import { FooterSection } from "@/components/FooterSection";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PageSlideSection } from "@/components/PageSlideSection";
import { Preloader } from "@/components/Preloader";
import { ScrollPauseIndicator } from "@/components/ScrollPauseIndicator";
import { ThreeShowcase } from "@/components/ThreeShowcase";
import { ProjectShowcase } from "@/components/ui/project-showcase";

export default function Home() {
  return (
    <>
      <Preloader />
      <Header />
      <ScrollPauseIndicator />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <HeroSection />
          <div id="three-showcase" style={{ marginBottom: '-100vh' }}><ThreeShowcase /></div>

          {/* Clip 1: Who We Are */}
          <PageSlideSection id="brand-section" zIndex={10} scrollLength="+=30%">
            <BrandSection />
          </PageSlideSection>

          {/* Clip 2: Technologies We Work With */}
          <PageSlideSection id="clients-section" zIndex={20} scrollLength="+=50%">
            <ClientsSection />
          </PageSlideSection>

          {/* Clip 3: Selected Work / Portfolio */}
          <PageSlideSection id="project-showcase" zIndex={30} scrollLength="+=50%">
            <div className="bg-[#0e1418] min-h-screen flex items-center">
              <ProjectShowcase />
            </div>
          </PageSlideSection>

          {/* Clip 4: What We Do */}
          <PageSlideSection id="capabilities-section" zIndex={40} scrollLength="+=50%">
            <CapabilitiesSection />
          </PageSlideSection>

          {/* Clip 5: Let's Build Something Real */}
          <PageSlideSection id="cta-section" zIndex={50} scrollLength="+=50%">
            <CTASection />
          </PageSlideSection>

          <FooterSection />
        </div>
      </div>
    </>
  );
}
