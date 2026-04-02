"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

const row1 = [
  { src: "/images/logos/logo--python.svg", alt: "Python" },
  { src: "/images/logos/logo--pytorch.svg", alt: "PyTorch" },
  { src: "/images/logos/logo--tensorflow.svg", alt: "TensorFlow" },
  { src: "/images/logos/logo--openai.svg", alt: "OpenAI" },
  { src: "/images/logos/logo--flutter.svg", alt: "Flutter" },
  { src: "/images/logos/logo--react.svg", alt: "React" },
];

const row2 = [
  { src: "/images/logos/logo--fastapi.svg", alt: "FastAPI" },
  { src: "/images/logos/logo--postgresql.svg", alt: "PostgreSQL" },
  { src: "/images/logos/logo--docker.svg", alt: "Docker" },
  { src: "/images/logos/logo--vercel.svg", alt: "Vercel" },
  { src: "/images/logos/logo--nextjs.svg", alt: "Next.js" },
  { src: "/images/logos/logo--tailwindcss.svg", alt: "Tailwind CSS" },
];

function MarqueeRow({ logos, direction, duration }: {
  logos: typeof row1;
  direction: "left" | "right";
  duration: number;
}) {
  // Duplicate enough times to fill viewport + overflow
  const allLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <div className="overflow-hidden">
      <div
        className="flex w-max gap-4 md:gap-5"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
        }}
      >
        {allLogos.map((logo, i) => (
          <div
            key={`${logo.alt}-${i}`}
            className="group flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] w-[160px] h-[100px] md:w-[220px] md:h-[130px] shrink-0 hover:border-[#94fcff]/15 hover:bg-white/[0.04] transition-all duration-300"
          >
            <img
              src={logo.src}
              alt={`${logo.alt} logo`}
              className="max-h-[32px] md:max-h-[40px] w-auto opacity-60 group-hover:opacity-90 transition-opacity duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClientsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const scroller = document.querySelector("main");
    if (!scroller) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const heading = section.querySelector(".clients-heading");
    if (heading) {
      gsap.from(heading, {
        y: 40, autoAlpha: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: heading, scroller, start: "top 85%", toggleActions: "play none none reverse" },
      });
    }

    const desc = section.querySelector(".clients-desc");
    if (desc) {
      gsap.from(desc, {
        y: 30, autoAlpha: 0, duration: 0.6, delay: 0.15, ease: "power2.out",
        scrollTrigger: { trigger: heading, scroller, start: "top 85%", toggleActions: "play none none reverse" },
      });
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="bg-[#0e1418] py-16 md:py-24 overflow-hidden">
      {/* Marquee keyframes */}
      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-row { animation: none !important; }
        }
      `}</style>

      {/* Header row */}
      <div className="mb-10 md:mb-16 flex flex-col gap-4 px-5 md:flex-row md:items-start md:justify-between md:px-[60px]">
        <h2
          className="clients-heading font-normal uppercase tracking-[2px] text-white font-[family-name:var(--font-display)]"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
        >
          Technologies We Work With
        </h2>
        <p className="clients-desc max-w-[280px] text-[10px] font-medium uppercase tracking-[1.5px] text-white/40 md:text-right leading-[1.8]">
          Production-grade tools powering our AI solutions across vision, language, and documents.
        </p>
      </div>

      {/* Scrolling logo rows — CSS infinite marquee */}
      <div className="flex flex-col gap-4 md:gap-5">
        <MarqueeRow logos={row1} direction="left" duration={30} />
        <MarqueeRow logos={row2} direction="right" duration={35} />
      </div>
    </section>
  );
}
