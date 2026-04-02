"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
    icon: "\u2192",
    skills: [
      "End-to-End Development",
      "Mobile & Web Deployment",
      "API Integration",
      "Model Monitoring & Retraining",
      "Ongoing Support & Maintenance",
    ],
  },
];

const categoryButtons = ["v", "l", "d", "\u2192"];

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
        "capability-card bg-white text-[#0e1418] rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col justify-between min-h-0 md:min-h-[380px]",
        "transition-all duration-500 hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1",
        className
      )}
      style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
    >
      {/* Card header */}
      <div>
        <div className="flex justify-between items-center mb-3 md:mb-5">
          <h3 className="text-[14px] md:text-[18px] font-bold uppercase">
            {capability.title}
          </h3>
          <span className="text-[16px] md:text-[22px] font-bold font-mono">
            {capability.icon}
          </span>
        </div>
        {/* Skills list */}
        <div>
          {capability.skills.map((skill) => (
            <div
              key={skill}
              className="skill-item py-2 md:py-2.5 border-b border-dotted border-black/20 text-[11px] md:text-[13px]"
            >
              {skill}
            </div>
          ))}
        </div>
      </div>
      {/* Card footer (upside down, playing card style) */}
      <div className="hidden md:flex justify-between items-center rotate-180 mt-4">
        <span className="text-[20px] font-bold font-mono">
          {capability.icon}
        </span>
        <span className="text-[12px] font-bold uppercase">
          {capability.title}
        </span>
      </div>
    </div>
  );
}

export function CapabilitiesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    // Heading animation
    const heading = section.querySelector(".capabilities-heading");
    const desc = section.querySelector(".capabilities-desc");
    const cards = section.querySelectorAll<HTMLElement>(".capability-card");
    const catBtns = section.querySelectorAll(".cat-btn");

    gsap.from(heading, {
      y: 60,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: heading,

        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });

    gsap.from(desc, {
      y: 40,
      autoAlpha: 0,
      duration: 0.7,
      delay: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: heading,

        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });

    cards.forEach((card, i) => {
      gsap.from(card, {
        y: isDesktop ? 100 : 60,
        autoAlpha: 0,
        scale: isDesktop ? 0.95 : 1,
        duration: 0.9,
        delay: isDesktop ? i * 0.15 : 0,
        ease: "power4.out",
        scrollTrigger: {
          trigger: card,

          start: isDesktop ? "top 85%" : "top 90%",
          toggleActions: "play none none reverse",
        },
      });

      const skillItems = card.querySelectorAll(".skill-item");
      gsap.from(skillItems, {
        x: -20,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,

          start: isDesktop ? "top 75%" : "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    });

    gsap.from(catBtns, {
      scale: 0,
      autoAlpha: 0,
      duration: 0.4,
      stagger: 0.08,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: heading,

        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });

  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className={cn(
        "relative bg-[#0e1418] text-white px-5 min-h-[100dvh] flex flex-col justify-center py-8",
        "md:px-[60px] md:py-10"
      )}
    >
      {/* Top area: heading left, description+buttons right */}
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:justify-between md:items-start md:mb-8">
        <h2
          className="capabilities-heading text-[clamp(2rem,8vw,100px)] font-normal uppercase leading-[0.9] font-[family-name:var(--font-display)]"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          WHAT WE
          <br />
          <span className="ml-[0.3em] md:ml-[0.5em]">DO</span>
        </h2>
        <div className="capabilities-desc max-w-[300px] md:max-w-[250px]">
          <p className="text-[11px] font-medium uppercase tracking-[1px]">
            AI SOLUTIONS THAT SHIP &mdash; FROM PROTOTYPE TO PRODUCTION,
            BUILT FOR REAL BUSINESSES.
          </p>
          <div className="flex gap-2 mt-4">
            {categoryButtons.map((label) => (
              <span
                key={label}
                className="cat-btn w-8 h-8 border border-white/30 rounded text-[12px] font-mono flex items-center justify-center"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid — responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {capabilities.map((capability) => (
          <CapabilityCard key={capability.title} capability={capability} />
        ))}
      </div>
    </section>
  );
}
