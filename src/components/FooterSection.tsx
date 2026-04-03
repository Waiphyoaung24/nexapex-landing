"use client";

import { useRef } from "react";
import { ArrowRight, ArrowUp } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export function FooterSection() {
  const backToTopRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const scrollToTop = () => {
    const sm = ScrollSmoother.get();
    if (sm) {
      sm.scrollTo(0, true);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useGSAP(() => {
    const footer = footerRef.current;
    const btn = backToTopRef.current;
    if (!footer || !btn) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    // Footer content stagger reveal
    const footerCols = footer.querySelectorAll(".footer-col");
    footerCols.forEach((col, i) => {
      gsap.from(col, {
        y: 40,
        autoAlpha: 0,
        duration: 0.7,
        delay: i * 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: footer,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    });

    // Back-to-top button entrance animation
    gsap.from(btn, {
      scale: 0,
      autoAlpha: 0,
      duration: 0.5,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: footer,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });

    // Pulse animation on the back-to-top arrow
    gsap.to(btn.querySelector("svg"), {
      y: -3,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });
  }, { scope: footerRef });

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#0e1418] text-[#c8ccc6] pt-10 pb-10 px-5 md:pt-14 md:pb-14 md:px-[60px]"
    >
      {/* Top divider */}
      <div className="absolute top-0 left-5 right-5 md:left-[60px] md:right-[60px] h-px bg-gradient-to-r from-transparent via-[#94fcff]/15 to-transparent" />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-10 mb-14 sm:grid-cols-2 md:grid-cols-3 md:gap-10 md:mb-20">
        {/* Column 1: Logo + Address */}
        <div className="footer-col">
          <img
            src="/images/Flat_white.png"
            alt="NexApex logo"
            width={48}
            height={48}
            className="mb-4 h-10 w-10 md:h-12 md:w-12 object-contain"
          />
          <address className="not-italic text-[14px] leading-relaxed text-white/50">
            NexApex HQ
            <br />
            Bangkok, Thailand
          </address>
        </div>

        {/* Column 2: Social + Contact */}
        <div className="footer-col">
          <nav aria-label="Social media links" className="mb-8 md:mb-10">
            <a
              href="https://twitter.com/nexapex"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[14px] leading-loose cursor-pointer hover:text-[#94fcff] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
            >
              Twitter / X
            </a>
            <a
              href="https://instagram.com/nexapex.co"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[14px] leading-loose cursor-pointer hover:text-[#94fcff] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
            >
              Instagram
            </a>
            <a
              href="https://linkedin.com/company/nexapex"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[14px] leading-loose cursor-pointer hover:text-[#94fcff] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
            >
              LinkedIn
            </a>
          </nav>
          <div className="mb-8 md:mb-10">
            <p className="text-[12px] font-medium text-white/40 mb-1">
              General enquiries
            </p>
            <a
              href="mailto:nexuslab.dev.mm@gmail.com"
              className="text-[14px] cursor-pointer hover:text-[#94fcff] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
            >
              support@nexapex.ai
            </a>
          </div>
          <div>
            <p className="text-[12px] font-medium text-white/40 mb-1">
              New business
            </p>
            <a
              href="mailto:nexuslab.dev.mm@gmail.com"
              className="text-[14px] cursor-pointer hover:text-[#94fcff] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
            >
              business@nexapex.ai
            </a>
          </div>
        </div>

        {/* Column 3: Newsletter + Back to top */}
        <div className="footer-col sm:col-span-2 md:col-span-1">
          <h3 className="text-[28px] md:text-[36px] font-normal font-[family-name:var(--font-display)] leading-tight mb-6 md:mb-8">
            Subscribe to our newsletter
          </h3>
          <div className="relative mb-6">
            <label htmlFor="footer-email" className="sr-only">
              Your email address
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="Your email"
              className="w-full py-4 px-5 bg-[#1a2630] text-[#f0f1ef] rounded-xl border border-[#94fcff]/10 text-[14px] placeholder:text-[#6e7a84] outline-none transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-[#94fcff]"
              style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
              style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
              aria-label="Subscribe to newsletter"
            >
              <ArrowRight size={20} className="text-[#94fcff]" />
            </button>
          </div>
          <button
            ref={backToTopRef}
            type="button"
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full bg-[#1a2630] text-[#94fcff] flex items-center justify-center cursor-pointer transition-all duration-300 hover:bg-[#253a49] hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
            aria-label="Back to top"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="flex flex-col gap-2 pt-8 border-t border-[#94fcff]/10 text-[12px] text-white/30 sm:flex-row sm:justify-between sm:items-center sm:pt-10">
        <span>&copy;2026 NEX APEX</span>
        <span>Built by NexApex with love</span>
      </div>
    </footer>
  );
}
