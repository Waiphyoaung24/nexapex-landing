import React from 'react';
import Footer from './Footer';

export default function LandingSections() {
  return (
    <>
      {/* ─── 2. WHAT WE DO ─── */}
      <section id="services" className="py-16 md:py-[120px] px-6 md:px-12 border-t border-cyan-subtle">
        <div className="max-w-[1400px] mx-auto">
          <p className="font-m text-[12px] md:text-[14px] font-semibold tracking-[2px] uppercase text-cyan mb-3 md:mb-4">What We Do</p>
          <h2 className="font-d font-bold tracking-wider text-gradient mb-10 md:mb-20"
            style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            OUR SOLUTIONS
          </h2>

          <div className="grid md:grid-cols-3 gap-4 md:gap-8">
            {/* AI Strategy & Development */}
            <div className="group relative border border-cyan-subtle rounded-[14px] p-6 md:p-8 transition-all duration-500 hover:border-cyan/20 hover:bg-surface/50 hover:-translate-y-1 cursor-pointer overflow-hidden" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-cyan rounded-r transition-all duration-500 group-hover:h-12" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }} />
              <div className="w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6 flex items-center justify-center border border-cyan/20 rounded-xl text-cyan transition-colors duration-300 group-hover:bg-cyan/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h3 className="font-d text-base md:text-lg font-semibold tracking-wider text-white mb-2 md:mb-3">AI Strategy & Development</h3>
              <p className="font-b text-dim text-sm md:text-base leading-relaxed">
                End-to-end design and deployment of intelligent systems — from feasibility analysis to production-grade AI solutions tailored to your business.
              </p>
            </div>

            {/* Systems Integration */}
            <div className="group relative border border-cyan-subtle rounded-[14px] p-6 md:p-8 transition-all duration-500 hover:border-cyan/20 hover:bg-surface/50 hover:-translate-y-1 cursor-pointer overflow-hidden" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-cyan rounded-r transition-all duration-500 group-hover:h-12" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }} />
              <div className="w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6 flex items-center justify-center border border-cyan/20 rounded-xl text-cyan transition-colors duration-300 group-hover:bg-cyan/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h3a1 1 0 001-1V4" />
                  <path d="M20 7h-3a1 1 0 01-1-1V4" />
                  <path d="M4 17h3a1 1 0 001 1v2" />
                  <path d="M20 17h-3a1 1 0 01-1 1v2" />
                  <rect x="8" y="8" width="8" height="8" rx="1" />
                </svg>
              </div>
              <h3 className="font-d text-base md:text-lg font-semibold tracking-wider text-white mb-2 md:mb-3">Systems Integration</h3>
              <p className="font-b text-dim text-sm md:text-base leading-relaxed">
                Bridging software with physical infrastructure — connecting sensors, machinery, and data pipelines into unified, automated workflows.
              </p>
            </div>

            {/* Data Intelligence */}
            <div className="group relative border border-cyan-subtle rounded-[14px] p-6 md:p-8 transition-all duration-500 hover:border-cyan/20 hover:bg-surface/50 hover:-translate-y-1 cursor-pointer overflow-hidden" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }}>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-cyan rounded-r transition-all duration-500 group-hover:h-12" style={{ transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }} />
              <div className="w-10 h-10 md:w-12 md:h-12 mb-4 md:mb-6 flex items-center justify-center border border-cyan/20 rounded-xl text-cyan transition-colors duration-300 group-hover:bg-cyan/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M7 16l4-8 4 5 4-10" />
                </svg>
              </div>
              <h3 className="font-d text-base md:text-lg font-semibold tracking-wider text-white mb-2 md:mb-3">Data Intelligence</h3>
              <p className="font-b text-dim text-sm md:text-base leading-relaxed">
                Turning raw operational data into real-time insights and automated decisions — powering smarter pricing, forecasting, and resource allocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. HOW WE WORK ─── */}
      <section id="process" className="py-16 md:py-[120px] px-6 md:px-12 border-t border-cyan-subtle">
        <div className="max-w-[1400px] mx-auto">
          <p className="font-m text-[12px] md:text-[14px] font-semibold tracking-[2px] uppercase text-cyan mb-3 md:mb-4">How We Work</p>
          <h2 className="font-d font-bold tracking-wider text-gradient mb-10 md:mb-20"
            style={{ fontSize: 'clamp(24px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            OUR PROCESS
          </h2>

          <div className="grid md:grid-cols-3 gap-0">
            {[
              { step: '01', title: 'Discover', desc: 'Deep-dive into your operations, pain points, and automation opportunities across digital and physical systems.' },
              { step: '02', title: 'Build', desc: 'Rapid iteration with weekly demos. From RAG pipelines to hardware integration — no black-box development.' },
              { step: '03', title: 'Deploy', desc: 'Production-hardened launch with 24/7 automated decision-making, monitoring, and continuous optimization.' },
            ].map((item, i) => (
              <div key={item.step} className="relative flex flex-col items-center text-center px-6 md:px-8 py-8 md:py-10">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 right-0 w-1/2 h-px bg-gradient-to-r from-cyan/30 to-transparent" />
                )}
                {i > 0 && (
                  <div className="hidden md:block absolute top-16 left-0 w-1/2 h-px bg-gradient-to-l from-cyan/30 to-transparent" />
                )}

                <span className="font-d text-3xl md:text-4xl font-bold text-cyan/20 mb-3 md:mb-4">{item.step}</span>
                <h3 className="font-d text-lg md:text-xl font-semibold tracking-wider text-white mb-2 md:mb-3">{item.title}</h3>
                <p className="font-b text-dim text-sm md:text-base leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. WHY NEX APEX ─── */}
      <section id="why" className="py-[120px] px-6 md:px-12 border-t border-cyan-subtle bg-surface/30">
        <div className="max-w-[1400px] mx-auto">
          <p className="font-m text-[14px] font-semibold tracking-[2px] uppercase text-cyan mb-4">Why NexApex</p>
          <h2 className="font-d font-bold tracking-wider text-gradient mb-20"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            OUR ADVANTAGE
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '24/7', label: 'Automated Decisions' },
              { value: '3', label: 'AI Products' },
              { value: 'SEA', label: 'Market Focus' },
              { value: 'Lab', label: 'Driven Approach' },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-8 border border-cyan-subtle rounded-[12px]">
                <span className="block font-d text-4xl md:text-5xl font-bold text-cyan mb-2">{stat.value}</span>
                <span className="font-m text-[11px] tracking-[2px] uppercase text-dim">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. PRODUCTS ─── */}
      <section id="work" className="py-[120px] px-6 md:px-12 border-t border-cyan-subtle">
        <div className="max-w-[1400px] mx-auto">
          <p className="font-m text-[14px] font-semibold tracking-[2px] uppercase text-cyan mb-4">Products</p>
          <h2 className="font-d font-bold tracking-wider text-gradient mb-20"
            style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', letterSpacing: '1px' }}
          >
            IN DEVELOPMENT
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI Hotel Revenue Manager',
                category: 'Hospitality AI',
                desc: 'Real-time competitor price monitoring with dynamic profit-ratio adjustments for the Thai hospitality sector.',
              },
              {
                title: 'Dairy Production AI',
                category: 'Industrial AI',
                desc: 'AI-driven machinery and quality control systems for dairy manufacturing — bridging intelligence with physical production.',
              },
              {
                title: 'Smart POS System',
                category: 'Retail AI',
                desc: 'RAG-powered retail management with high-fidelity analytics for cross-border enterprises in Southeast Asia.',
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
              NexApex is a Bangkok-based AI lab where software meets the physical world. We build intelligent systems that operate across industries — from digital revenue platforms to factory-floor automation.
            </p>
            <p className="font-b text-lg md:text-xl text-dim leading-[1.85]">
              Our founding team combines deep technical expertise with hands-on operational experience. We take a lab-driven approach — prototyping fast, deploying with precision, and optimizing continuously. We work with manufacturers, hospitality businesses, and enterprises across Southeast Asia who are ready to replace manual processes with scalable intelligence.
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
            Let&apos;s automate your operations and scale your business with precision AI.
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
    </>
  );
}
