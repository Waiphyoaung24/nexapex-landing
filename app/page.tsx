'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import Footer from '@/components/Footer';

export default function Home() {

  // Initialize smooth scrolling from brand requirements (using lenis)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <main className="w-full bg-bg text-white min-h-screen">
      <Navbar />

      {/* Hero 1 */}
      <HeroSection
        id="intro"
        logoSrc="/White_iconmark.png"
        title="THE APEX OF INTELLIGENCE"
        subtitle="Unleashing AI Potential"
      />

      {/* Hero 2 */}
      <HeroSection
        id="features"
        title="LIMITLESS SCALABILITY"
        subtitle="Built for the Future"
      />

      {/* Hero 3 */}
      <HeroSection
        id="showcase"
        title="IMMERSIVE EXPERIENCES"
        subtitle="Interactive 3D Web Solutions"
        showLine={false}
      />

      <Footer />
    </main>
  );
}
