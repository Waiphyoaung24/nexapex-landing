"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEditorialReveal } from "@/lib/editorial-reveal";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

interface Capability {
  title: string;
  icon: string;
  skills: string[];
}

const capabilities: Capability[] = [
  {
    title: "Vision",
    icon: "V",
    skills: [
      "Object Detection & Classification",
      "Quality Control & Inspection",
      "Inventory & Asset Tracking",
      "Real-Time Camera Analytics",
      "Custom Model Training",
    ],
  },
  {
    title: "Language",
    icon: "L",
    skills: [
      "Custom AI Assistants",
      "Multilingual Chat (EN/MY/TH)",
      "Business Process Automation",
      "Knowledge Base Integration",
      "Fine-Tuned LLM Deployment",
    ],
  },
  {
    title: "Documents",
    icon: "D",
    skills: [
      "OCR & Text Extraction",
      "Invoice & Receipt Processing",
      "Contract Data Mining",
      "Structured Data Export",
      "Multi-Format Support",
    ],
  },
  {
    title: "Delivery",
    icon: "→",
    skills: [
      "End-to-End Development",
      "Mobile & Web Deployment",
      "API Integration",
      "Model Monitoring & Retraining",
      "Ongoing Support & Maintenance",
    ],
  },
];

const categoryButtons = ["v", "l", "d", "→"];

function CapabilityCard({
  capability,
  className,
}: {
  capability: Capability;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "editorial-item capability-card bg-white text-[#0e1418] rounded-xl p-3 sm:p-4 lg:p-5 flex flex-col",
        "transition-all duration-500 hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 cursor-pointer",
        className,
      )}
      style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
    >
      {/* Card header */}
      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-4">
        <h3 className="text-[12px] sm:text-[14px] lg:text-[16px] font-semibold uppercase tracking-wide">
          {capability.title}
        </h3>
        <span className="text-[14px] sm:text-[18px] lg:text-[20px] font-bold font-mono text-[#0e1418]/40">
          {capability.icon}
        </span>
      </div>

      {/* Skills list */}
      <div className="flex-1">
        {capability.skills.map((skill) => (
          <div
            key={skill}
            className="skill-item py-1.5 sm:py-2 lg:py-2.5 border-b border-dotted border-black/15 text-[10px] sm:text-[11px] lg:text-[13px] leading-tight"
          >
            {skill}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CapabilitiesSection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEditorialReveal(sectionRef);

  // Tertiary detail animations: cat-btn scale-in + per-card skill-item slide-in.
  // Kept inline because they're decorative chrome, not part of the editorial beat.
  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    const cards = section.querySelectorAll<HTMLElement>(".capability-card");
    cards.forEach((card) => {
      const skillItems = card.querySelectorAll(".skill-item");
      gsap.from(skillItems, {
        x: -15,
        autoAlpha: 0,
        duration: 0.4,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: isDesktop ? "top 75%" : "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    });

    const catBtns = section.querySelectorAll(".cat-btn");
    gsap.from(catBtns, {
      scale: 0,
      autoAlpha: 0,
      duration: 0.4,
      stagger: 0.08,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: section.querySelector(".capabilities-heading"),
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });
  }, { scope: sectionRef });

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative bg-nex-background text-white min-h-[100dvh] flex flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-[60px]"
    >
      {/* Top area: heading left, description+buttons right */}
      <div className="flex flex-col gap-2 mb-4 sm:mb-5 md:flex-row md:justify-between md:items-end md:mb-8">
        <div>
          <p
            className="editorial-index text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50 mb-3"
            aria-hidden="true"
          >
            05 / WHAT WE DO
          </p>
          <h2
            className="editorial-heading capabilities-heading text-[clamp(1.8rem,7vw,90px)] font-normal uppercase leading-[0.9] font-[family-name:var(--font-display)]"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            WHAT WE
            <br />
            <span className="ml-[0.3em] md:ml-[0.5em]">DO</span>
          </h2>
        </div>
        <div className="capabilities-desc max-w-[280px]">
          <p className="editorial-body text-[10px] sm:text-[11px] font-medium uppercase tracking-[1px] text-white/70 leading-relaxed">
            AI SOLUTIONS THAT SHIP &mdash; FROM PROTOTYPE TO PRODUCTION,
            BUILT FOR REAL BUSINESSES.
          </p>
          <div className="flex gap-1.5 sm:gap-2 mt-3">
            {categoryButtons.map((label) => (
              <span
                key={label}
                className="cat-btn w-7 h-7 sm:w-8 sm:h-8 border border-white/20 rounded text-[11px] sm:text-[12px] font-mono flex items-center justify-center text-white/50"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid — 2 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        {capabilities.map((capability) => (
          <CapabilityCard key={capability.title} capability={capability} />
        ))}
      </div>
    </section>
  );
}
