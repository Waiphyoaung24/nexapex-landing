"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AwardEntry {
  org: string;
  count: string;
  name: string;
}

const awardsData: AwardEntry[] = [
  { org: "Google", count: "001", name: "Cloud AI Partner of the Year" },
  { org: "Google", count: "001", name: "ML Specialization Certified" },
  { org: "NVIDIA", count: "001", name: "Inception Program Member" },
  { org: "NVIDIA", count: "001", name: "DGX-Ready Partner" },
  { org: "AWS", count: "001", name: "Advanced Technology Partner" },
  { org: "AWS", count: "001", name: "ML Competency Certified" },
  { org: "Microsoft", count: "001", name: "Azure AI Solutions Partner" },
  { org: "Forbes", count: "001", name: "Top 50 AI Companies to Watch" },
  { org: "Gartner", count: "001", name: "Cool Vendor in AI" },
  { org: "TechCrunch", count: "001", name: "AI Startup of the Year" },
];

interface ArticleEntry {
  title: string;
}

const articlesData: ArticleEntry[] = [
  { title: "How NexApex Is Redefining Enterprise AI Integration" },
  { title: "Building the Future: AI-First Product Development" },
  { title: "From Data to Decisions: The NexApex Approach" },
  { title: "Scaling ML Pipelines for Fortune 500 Clients" },
];

interface TalkEntry {
  name: string;
  date: string;
}

const talksData: TalkEntry[] = [
  { name: "AI Summit Global", date: "Mar 2026 Singapore" },
  { name: "Google I/O Extended", date: "May 2025 Bangkok" },
  { name: "NeurIPS Workshop", date: "Dec 2025 Vancouver" },
  { name: "TechCrunch Disrupt", date: "Oct 2025 San Francisco" },
  { name: "RISE Conference", date: "Jul 2025 Hong Kong" },
];

function groupAwards(awards: AwardEntry[]): AwardEntry[][] {
  const groups: AwardEntry[][] = [];
  let currentGroup: AwardEntry[] = [];
  let currentOrg = "";

  for (const award of awards) {
    if (award.org !== currentOrg) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [award];
      currentOrg = award.org;
    } else {
      currentGroup.push(award);
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export function AwardsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const awardGroups = groupAwards(awardsData);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const scroller = document.querySelector("main");
    if (!scroller) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    // Heading reveal
    const headings = section.querySelectorAll(".awards-heading");
    headings.forEach((heading) => {
      gsap.from(heading, {
        y: 40,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: heading,
          scroller,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });
    });

    // Counter animation for "10"
    const counterEl = counterRef.current;
    if (counterEl) {
      const counterObj = { val: 0 };
      gsap.to(counterObj, {
        val: 10,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: counterEl,
          scroller,
          start: "top 85%",
          toggleActions: "play none none reverse",
          onEnter: () => {
            gsap.to(counterObj, {
              val: 10,
              duration: 1.5,
              ease: "power2.out",
              onUpdate: () => {
                counterEl.textContent = String(Math.round(counterObj.val));
              },
            });
          },
          onLeaveBack: () => {
            counterObj.val = 0;
            counterEl.textContent = "0";
          },
        },
      });
    }

    // Staggered award rows reveal
    const awardRows = section.querySelectorAll(".award-row");
    awardRows.forEach((row, i) => {
      gsap.from(row, {
        y: 30,
        autoAlpha: 0,
        duration: 0.5,
        delay: i * 0.06,
        ease: "power2.out",
        scrollTrigger: {
          trigger: row,
          scroller,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });
    });

    // Publications rows
    const pubRows = section.querySelectorAll(".pub-row");
    pubRows.forEach((row, i) => {
      gsap.from(row, {
        y: 20,
        autoAlpha: 0,
        duration: 0.5,
        delay: i * 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: row,
          scroller,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });
    });

    // Talks rows
    const talkRows = section.querySelectorAll(".talk-row");
    talkRows.forEach((row, i) => {
      gsap.from(row, {
        y: 20,
        autoAlpha: 0,
        duration: 0.5,
        delay: i * 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: row,
          scroller,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0e1418] px-5 py-16 text-white md:px-[60px] md:py-24"
    >
      {/* Watermark text */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute left-[-20px] top-[10%] text-[200px] font-bold uppercase text-[#94fcff]/[0.03]">
          RECOGNITION
        </span>
        <span className="absolute left-[-20px] top-[30%] text-[200px] font-bold uppercase text-[#94fcff]/[0.03]">
          &amp; IMPACT
        </span>
      </div>

      {/* Awards Header */}
      <div className="awards-heading relative z-10 mb-10 flex items-center gap-4">
        <h2 className="text-[18px] md:text-[24px] uppercase tracking-[2px]">Recognition</h2>
        <span className="text-[18px] md:text-[24px] text-[#94fcff]">{"\u2733"}</span>
        <span ref={counterRef} className="font-mono text-[18px] md:text-[24px]">10</span>
      </div>

      {/* Awards Table */}
      <div className="relative z-10 ml-auto max-w-full md:max-w-[600px]">
        {awardGroups.map((group) =>
          group.map((award, entryIndex) => (
            <div
              key={`${award.org}-${award.name}`}
              className={cn(
                "award-row flex items-start border-b border-white/10 py-3",
                "transition-colors duration-200 hover:bg-white/[0.03]"
              )}
            >
              <span className="w-[90px] md:w-[160px] text-[13px] md:text-[14px]">
                {entryIndex === 0 ? award.org : ""}
              </span>
              <span className="w-[40px] md:w-[60px] font-mono text-[13px] md:text-[14px] text-[#94fcff]/60">
                {award.count}
              </span>
              <span className="flex-1 text-[14px]">{award.name}</span>
            </div>
          ))
        )}
      </div>

      {/* Publications Sub-section */}
      <div className="relative z-10 mt-16">
        <div className="awards-heading mb-6 flex items-center gap-4">
          <h3 className="text-[18px] md:text-[24px] uppercase tracking-[2px]">Publications</h3>
          <span className="text-[18px] md:text-[24px] text-[#94fcff]">{"\u2605"}</span>
          <span className="font-mono text-[18px] md:text-[24px]">04</span>
        </div>
        <div className="ml-auto max-w-[600px]">
          {articlesData.map((article) => (
            <p key={article.title} className="pub-row py-2 text-[14px]">
              {article.title}
            </p>
          ))}
        </div>
      </div>

      {/* Talks Sub-section */}
      <div className="relative z-10 mt-16">
        <div className="awards-heading mb-6 flex items-center gap-4">
          <h3 className="text-[18px] md:text-[24px] uppercase tracking-[2px]">Speaking</h3>
          <span className="text-[18px] md:text-[24px] text-[#94fcff]">{"\u229E"}</span>
          <span className="font-mono text-[18px] md:text-[24px]">5</span>
        </div>
        <div className="ml-auto max-w-[600px]">
          {talksData.map((talk) => (
            <div
              key={`${talk.name}-${talk.date}`}
              className="talk-row flex justify-between py-2 text-[14px] text-white/30"
            >
              <span>{talk.name}</span>
              <span>{talk.date}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
