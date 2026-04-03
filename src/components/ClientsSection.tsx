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
        className="flex w-max gap-3 md:gap-5"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
        }}
      >
        {allLogos.map((logo, i) => (
          <div
            key={`${logo.alt}-${i}`}
            className="group flex items-center justify-center rounded-lg md:rounded-xl border border-white/[0.06] bg-white/[0.02] w-[120px] h-[75px] md:w-[180px] md:h-[100px] shrink-0 hover:border-[#94fcff]/15 hover:bg-white/[0.04] transition-all duration-300"
          >
            <img
              src={logo.src}
              alt={`${logo.alt} logo`}
              className="max-h-[24px] md:max-h-[40px] w-auto opacity-60 group-hover:opacity-90 transition-opacity duration-300"
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const heading = section.querySelector(".clients-heading");
    if (heading) {
      gsap.from(heading, {
        y: 40, autoAlpha: 0, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: heading, start: "top 85%", toggleActions: "play none none reverse" },
      });
    }

    const desc = section.querySelector(".clients-desc");
    if (desc) {
      gsap.from(desc, {
        y: 30, autoAlpha: 0, duration: 0.6, delay: 0.15, ease: "power2.out",
        scrollTrigger: { trigger: heading, start: "top 85%", toggleActions: "play none none reverse" },
      });
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="bg-[#0e1418] min-h-screen flex flex-col justify-center overflow-hidden py-10 md:py-0">
      {/* Header row */}
      <div className="mb-8 md:mb-12 flex flex-col gap-3 px-5 md:flex-row md:items-start md:justify-between md:px-[60px]">
        <h2
          className="clients-heading font-normal uppercase tracking-[2px] font-[family-name:var(--font-display)]"
          style={{
            fontSize: "clamp(1.25rem, 3vw, 2.5rem)",
            background: "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Technologies We Work With
        </h2>
        <p className="clients-desc max-w-[280px] text-[10px] font-medium uppercase tracking-[1.5px] text-white/55 md:text-right leading-[1.6] md:leading-[1.8]">
          Production-grade tools powering our AI solutions across vision, language, and documents.
        </p>
      </div>

      {/* Scrolling logo rows — CSS infinite marquee */}
      <div className="flex flex-col gap-3 md:gap-4">
        <MarqueeRow logos={row1} direction="left" duration={30} />
        <MarqueeRow logos={row2} direction="right" duration={35} />
      </div>
    </section>
  );
}
