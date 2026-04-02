"use client";

import { useRef, useEffect } from "react";
import { ArrowRight, ArrowUp } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function FooterSection() {
  const backToTopRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const scrollToTop = () => {
    const main = document.querySelector("main");
    main?.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const footer = footerRef.current;
    const btn = backToTopRef.current;
    if (!footer || !btn) return;

    const scroller = document.querySelector("main");
    if (!scroller) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    // Back-to-top button entrance animation
    gsap.from(btn, {
      scale: 0,
      autoAlpha: 0,
      duration: 0.5,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: footer,
        scroller,
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

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#dfe4dc] text-[#0e1418] py-10 px-5 md:py-14 md:px-[60px]"
    >
      {/* Main grid */}
      <div className="grid grid-cols-1 gap-10 mb-14 sm:grid-cols-2 md:grid-cols-3 md:gap-10 md:mb-20">
        {/* Column 1: Logo + Address */}
        <div>
          {/* SVG export is broken (empty file) — use PNG instead */}
          <img
            src="/images/Flat_black.png"
            alt="NexApex logo"
            width={48}
            height={48}
            className="mb-4 h-10 w-10 md:h-12 md:w-12 object-contain"
          />
          <address className="not-italic text-[14px] leading-relaxed">
            NexApex HQ
            <br />
            Bangkok, Thailand
          </address>
        </div>

        {/* Column 2: Social + Contact */}
        <div>
          <nav aria-label="Social media links" className="mb-8 md:mb-10">
            <a
              href="https://twitter.com/nexapex"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[14px] leading-loose cursor-pointer hover:opacity-60 transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e1418]"
            >
              Twitter / X
            </a>
            <a
              href="https://instagram.com/nexapex.co"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[14px] leading-loose cursor-pointer hover:opacity-60 transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e1418]"
            >
              Instagram
            </a>
            <a
              href="https://linkedin.com/company/nexapex"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[14px] leading-loose cursor-pointer hover:opacity-60 transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e1418]"
            >
              Linkedin
            </a>
          </nav>
          <div className="mb-8 md:mb-10">
            <p className="text-[12px] font-medium text-[#0e1418]/50 mb-1">
              General enquiries
            </p>
            <a
              href="mailto:hello@nexapex.co"
              className="text-[14px] cursor-pointer hover:opacity-60 transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e1418]"
            >
              hello@nexapex.co
            </a>
          </div>
          <div>
            <p className="text-[12px] font-medium text-[#0e1418]/50 mb-1">
              New business
            </p>
            <a
              href="mailto:business@nexapex.co"
              className="text-[14px] cursor-pointer hover:opacity-60 transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e1418]"
            >
              business@nexapex.co
            </a>
          </div>
        </div>

        {/* Column 3: Newsletter + Back to top */}
        <div className="sm:col-span-2 md:col-span-1">
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
              className="w-full py-4 px-5 bg-[#1a2630] text-[#f0f1ef] rounded-lg border-none text-[14px] placeholder:text-[#6e7a84] outline-none focus-visible:ring-2 focus-visible:ring-[#94fcff] transition-shadow duration-200"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded transition-transform duration-200 ease-out hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
              aria-label="Subscribe to newsletter"
            >
              <ArrowRight size={20} className="text-[#94fcff]" />
            </button>
          </div>
          <button
            ref={backToTopRef}
            type="button"
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full bg-[#0e1418] text-white flex items-center justify-center cursor-pointer transition-all duration-200 ease-out hover:bg-[#0e1418]/80 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e1418]"
            aria-label="Back to top"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="flex flex-col gap-2 pt-8 border-t border-[#0e1418]/10 text-[12px] text-[#0e1418]/50 sm:flex-row sm:justify-between sm:items-center sm:pt-10">
        <span>&copy;2026 NEX APEX</span>
        <span>Built by NexApex with love</span>
      </div>

    </footer>
  );
}
