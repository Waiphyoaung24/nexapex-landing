'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Lenis from 'lenis';
import Image from 'next/image';
import { useEffect } from 'react';

export default function Home() {
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
    return () => { lenis.destroy(); };
  }, []);

  return (
    <main className="w-full bg-bg text-white min-h-screen">
      <Navbar />

      {/* ─── 1. HERO ─── */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(26,38,48,0.6), #0e1418 70%)' }}
      >
        <div className="relative z-10 text-center flex flex-col items-center max-w-4xl mx-auto px-6">
          <div className="relative w-40 h-40 mb-10 animate-float" style={{ filter: 'drop-shadow(0 0 50px rgba(148,252,255,0.1)) drop-shadow(0 0 100px rgba(148,252,255,0.06))' }}>
            <Image
              src="/full_color_logo.png"
              alt="NexApex"
              fill
              sizes="160px"
              className="object-contain"
              priority
            />
          </div>

          <p className="font-m text-[11px] tracking-[6px] uppercase text-dim mb-6 opacity-0 animate-fade-up [animation-delay:200ms]">
            NexApex
          </p>

          <h1 className="font-d font-extrabold tracking-widest text-gradient opacity-0 animate-fade-up [animation-delay:400ms]"
            style={{ fontSize: 'clamp(32px, 5vw, 58px)', letterSpacing: '2px' }}
          >
            THE APEX OF<br />INTELLIGENCE
          </h1>
        </div>

        <div className="absolute bottom-10 left-1/2 w-px h-20 bg-gradient-to-b from-cyan to-transparent animate-pulse-line -translate-x-1/2" />
      </section>

      {/* ─── 2. WHAT WE DO ─── */}
      <section id="services" className="py-[120px] px-6 md:px-12 border-t border-cyan-subtle">
        <div className="max-w-[1400px] mx-auto">
          <p className="font-m text-[14px] font-semibold tracking-[2px] uppercase text-cyan mb-4">What We Do</p>
          <h2 className="font-d font-bold tracking-wider text-gradient mb-20"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            CAPABILITIES
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* AI Development */}
            <div className="group relative border border-cyan-subtle rounded-[14px] p-8 transition-all duration-500 hover:border-cyan/20 hover:bg-surface/50 hover:-translate-y-1 cursor-pointer overflow-hidden" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-cyan rounded-r transition-all duration-500 group-hover:h-12" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }} />
              <div className="w-12 h-12 mb-6 flex items-center justify-center border border-cyan/20 rounded-xl text-cyan transition-colors duration-300 group-hover:bg-cyan/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="font-d text-lg font-semibold tracking-wider text-white mb-3">AI Development</h3>
              <p className="font-b text-dim text-base leading-relaxed">
                Custom AI solutions from intelligent agents to production ML pipelines, engineered for real-world impact.
              </p>
            </div>

            {/* Scalable Infrastructure */}
            <div className="group relative border border-cyan-subtle rounded-[14px] p-8 transition-all duration-500 hover:border-cyan/20 hover:bg-surface/50 hover:-translate-y-1 cursor-pointer overflow-hidden" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-cyan rounded-r transition-all duration-500 group-hover:h-12" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }} />
              <div className="w-12 h-12 mb-6 flex items-center justify-center border border-cyan/20 rounded-xl text-cyan transition-colors duration-300 group-hover:bg-cyan/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" />
                  <circle cx="6" cy="6" r="1" fill="currentColor" />
                  <circle cx="6" cy="18" r="1" fill="currentColor" />
                </svg>
              </div>
              <h3 className="font-d text-lg font-semibold tracking-wider text-white mb-3">Scalable Infrastructure</h3>
              <p className="font-b text-dim text-base leading-relaxed">
                Cloud-native architectures built to handle millions of requests with zero-downtime deployments.
              </p>
            </div>

            {/* Immersive 3D / Web */}
            <div className="group relative border border-cyan-subtle rounded-[14px] p-8 transition-all duration-500 hover:border-cyan/20 hover:bg-surface/50 hover:-translate-y-1 cursor-pointer overflow-hidden" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-cyan rounded-r transition-all duration-500 group-hover:h-12" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }} />
              <div className="w-12 h-12 mb-6 flex items-center justify-center border border-cyan/20 rounded-xl text-cyan transition-colors duration-300 group-hover:bg-cyan/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3L1 9l11 6 11-6-11-6z" />
                  <path d="M1 9v6l11 6" />
                  <path d="M23 9v6l-11 6" />
                </svg>
              </div>
              <h3 className="font-d text-lg font-semibold tracking-wider text-white mb-3">Immersive 3D & Web</h3>
              <p className="font-b text-dim text-base leading-relaxed">
                Interactive 3D experiences and high-performance web applications that captivate and convert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. HOW WE WORK ─── */}
      <section id="process" className="py-[120px] px-6 md:px-12 border-t border-cyan-subtle">
        <div className="max-w-[1400px] mx-auto">
          <p className="font-m text-[14px] font-semibold tracking-[2px] uppercase text-cyan mb-4">How We Work</p>
          <h2 className="font-d font-bold tracking-wider text-gradient mb-20"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            OUR PROCESS
          </h2>

          <div className="grid md:grid-cols-3 gap-0">
            {[
              { step: '01', title: 'Discover', desc: 'Deep-dive into your goals, users, and technical landscape.' },
              { step: '02', title: 'Build', desc: 'Rapid iteration with weekly demos. No black-box development.' },
              { step: '03', title: 'Deploy', desc: 'Production-hardened launch with monitoring and continuous optimization.' },
            ].map((item, i) => (
              <div key={item.step} className="relative flex flex-col items-center text-center px-8 py-10">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 right-0 w-1/2 h-px bg-gradient-to-r from-cyan/30 to-transparent" />
                )}
                {i > 0 && (
                  <div className="hidden md:block absolute top-16 left-0 w-1/2 h-px bg-gradient-to-l from-cyan/30 to-transparent" />
                )}

                <span className="font-d text-4xl font-bold text-cyan/20 mb-4">{item.step}</span>
                <h3 className="font-d text-xl font-semibold tracking-wider text-white mb-3">{item.title}</h3>
                <p className="font-b text-dim text-base leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. WHY NEX APEX ─── */}
      <section id="why" className="py-[120px] px-6 md:px-12 border-t border-cyan-subtle bg-surface/30">
        <div className="max-w-[1400px] mx-auto">
          <p className="font-m text-[14px] font-semibold tracking-[2px] uppercase text-cyan mb-4">Why Nex Apex</p>
          <h2 className="font-d font-bold tracking-wider text-gradient mb-20"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            BY THE NUMBERS
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '30+', label: 'Projects Delivered' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '15+', label: 'Tech Stack Depth' },
              { value: '100%', label: 'Client Satisfaction' },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-8 border border-cyan-subtle rounded-[12px]">
                <span className="block font-d text-4xl md:text-5xl font-bold text-cyan mb-2">{stat.value}</span>
                <span className="font-m text-[11px] tracking-[2px] uppercase text-dim">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. CASE STUDIES / WORK ─── */}
      <section id="work" className="py-[120px] px-6 md:px-12 border-t border-cyan-subtle">
        <div className="max-w-[1400px] mx-auto">
          <p className="font-m text-[14px] font-semibold tracking-[2px] uppercase text-cyan mb-4">Selected Work</p>
          <h2 className="font-d font-bold tracking-wider text-gradient mb-20"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            CASE STUDIES
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI Analytics Platform',
                category: 'AI / ML',
                desc: 'Real-time intelligence dashboard processing 2M+ events daily.',
              },
              {
                title: 'Immersive Brand Portal',
                category: '3D / WebGL',
                desc: 'Interactive 3D product configurator with 40% conversion lift.',
              },
              {
                title: 'Cloud Migration Suite',
                category: 'Infrastructure',
                desc: 'Zero-downtime migration of legacy systems to cloud-native architecture.',
              },
            ].map((project) => (
              <div key={project.title} className="group cursor-pointer border border-cyan-subtle rounded-[14px] overflow-hidden transition-all duration-500 hover:border-cyan/20 hover:-translate-y-1" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
                <div className="aspect-video bg-surface2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-d text-[11px] tracking-[3px] uppercase text-dim/40">Coming Soon</span>
                  </div>
                </div>
                <div className="p-6">
                  <span className="inline-block font-m text-[10px] tracking-[2px] uppercase text-cyan border border-cyan/20 rounded-md px-3 py-1 mb-4">
                    {project.category}
                  </span>
                  <h3 className="font-d text-base font-semibold tracking-wider text-white mb-2 group-hover:text-cyan transition-colors duration-300">
                    {project.title}
                  </h3>
                  <p className="font-b text-dim text-sm leading-relaxed">{project.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. ABOUT ─── */}
      <section id="about" className="py-[120px] px-6 md:px-12 border-t border-cyan-subtle">
        <div className="max-w-4xl mx-auto">
          <p className="font-m text-[14px] font-semibold tracking-[2px] uppercase text-cyan mb-4">About</p>
          <h2 className="font-d font-bold tracking-wider text-gradient mb-12"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            WHO WE ARE
          </h2>

          <div className="space-y-6">
            <p className="font-b text-lg md:text-xl text-text leading-[1.85]">
              Nex Apex is a Bangkok-based technology studio specializing in AI-driven solutions, scalable cloud infrastructure, and immersive digital experiences. We exist at the intersection of cutting-edge AI and premium engineering.
            </p>
            <p className="font-b text-lg md:text-xl text-dim leading-[1.85]">
              Founded with the belief that technology should be both powerful and beautiful, we partner with forward-thinking companies to build products that define the future.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 7. CTA BANNER ─── */}
      <section id="contact" className="py-[120px] px-6 md:px-12 border-t border-cyan-subtle bg-surface/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-d font-bold tracking-wider text-gradient mb-6"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            READY TO REACH<br />THE PEAK?
          </h2>
          <p className="font-b text-lg text-dim mb-10 tracking-wide leading-[1.6]">
            Let&apos;s build something extraordinary together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="mailto:hello@nexapex.ai"
              className="font-m text-sm font-medium tracking-[1.5px] uppercase px-10 py-4 bg-red text-white no-underline cursor-pointer rounded-[12px] transition-all duration-500 hover:shadow-[0_16px_48px_rgba(198,53,24,0.35)] hover:-translate-y-1"
              style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}
            >
              Get in Touch
            </a>
            <a
              href="mailto:hello@nexapex.ai"
              className="font-m text-sm font-medium tracking-[1.5px] uppercase px-10 py-4 border border-cyan/30 text-cyan no-underline cursor-pointer rounded-[12px] transition-all duration-300 hover:bg-cyan/10 hover:border-cyan/60"
            >
              hello@nexapex.ai
            </a>
          </div>
        </div>
      </section>

      {/* ─── 8. FOOTER ─── */}
      <Footer />
    </main>
  );
}
