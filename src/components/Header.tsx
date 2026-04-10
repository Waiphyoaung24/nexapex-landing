"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

const NAV_LINKS = [
  { label: "What We Build", target: "three-showcase" },
  { label: "Who We Are", target: "brand-section" },
  { label: "Technologies", target: "clients-section" },
  { label: "Portfolio", target: "project-showcase" },
  { label: "What We Do", target: "capabilities-section" },
  { label: "Contact", target: "cta-section" },
];

const SOCIALS = [
  { label: "Twitter / X", href: "https://twitter.com/nexapex" },
  { label: "Instagram", href: "https://instagram.com/nexapex.co" },
  { label: "LinkedIn", href: "https://linkedin.com/company/nexapex" },
];

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isLanding = pathname === "/";

  const scrollTo = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const sm = ScrollSmoother.get();
    if (!sm) {
      target.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // PageSlideSection uses ScrollTrigger pin + clip-path reveal.
    // Jump native scroll to pin END (clip fully open), then
    // refresh all triggers so text animations also fire.
    const pinTrigger = ScrollTrigger.getAll().find(
      (st) => st.trigger === target && st.pin
    );

    if (pinTrigger) {
      pinTrigger.scroll(pinTrigger.end);
    } else {
      sm.scrollTo(target, true);
      return;
    }

    // Refresh recalculates all trigger positions and applies
    // the correct state — clip-path AND text toggleActions fire.
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, []);

  // Detect scroll position for glassmorphism activation
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "px-4 py-4 md:px-[60px] md:py-6",
        "flex items-center justify-between",
        "transition-all duration-500",
        scrolled
          ? "glass-header py-3 md:py-4"
          : "bg-transparent"
      )}
      style={{
        transitionTimingFunction: "var(--ease-out-expo)",
      }}
    >
      {/* Logo — scroll to top on landing, navigate to / elsewhere */}
      <Link
        href="/"
        onClick={(e) => {
          if (isLanding) {
            e.preventDefault();
            const sm = ScrollSmoother.get();
            if (sm) sm.scrollTo(0, true);
            else window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <img
          src="/images/Flat_white.png"
          alt="NexApex"
          width={36}
          height={36}
          className="h-7 w-7 md:h-9 md:w-9 object-contain transition-transform duration-300 group-hover:scale-105"
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        />
        <span className="text-[14px] md:text-[20px] whitespace-nowrap font-bold uppercase font-[family-name:var(--font-display)] tracking-[3px] text-white">
          NEX APEX
        </span>
      </Link>

      {/* Button group */}
      <div className="flex items-center gap-2">
        {/* Quick-scroll to CTA (landing page only) */}
        {isLanding && (
          <button
            type="button"
            aria-label="Jump to contact"
            onClick={() => scrollTo("cta-section")}
            className={cn(
              "hidden md:flex h-[45px] w-[45px] items-center justify-center",
              "rounded-full bg-[#1a2630]/80 cursor-pointer",
              "border border-white/[0.04]",
              "transition-all duration-300 hover:bg-[#253a49] active:scale-[0.96]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
            )}
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            <span className="block h-[2px] w-[14px] rounded-full bg-white" />
          </button>
        )}

        {/* -- TRY OUR DEMOS -- */}
        <Link
          href="/demos"
          className={cn(
            "hidden md:flex items-center gap-2",
            "rounded-full bg-[#1a2630]/80 px-6 py-3 cursor-pointer",
            "border border-white/[0.04]",
            "font-mono text-[12px] font-medium uppercase tracking-[1px] text-white",
            "transition-all duration-300 hover:bg-[#253a49] active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
          )}
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          <span>TRY OUR DEMOS</span>
          <span className="block h-1 w-1 rounded-full bg-[#94fcff]" />
        </Link>

        {/* -- MENU Sheet -- */}
        <Sheet>
          <SheetTrigger
            className={cn(
              "flex items-center gap-2",
              "rounded-full bg-[#dfe4dc] px-6 py-3 cursor-pointer",
              "font-mono text-[12px] font-medium uppercase tracking-[1px] text-[#0e1418]",
              "transition-all duration-300 hover:bg-[#c8ccc6] active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e1418]"
            )}
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            <span>MENU</span>
            <span className="flex items-center gap-[3px]">
              <span className="block h-1 w-1 rounded-full bg-[#0e1418]" />
              <span className="block h-1 w-1 rounded-full bg-[#0e1418]" />
            </span>
          </SheetTrigger>

          <SheetContent
            side="right"
            showCloseButton={false}
            className="border-[#1a2630] bg-[#0e1418] text-white w-full sm:max-w-lg data-[side=right]:sm:max-w-lg p-0"
          >
            <div className="flex flex-col h-full">
              <SheetHeader className="px-8 pt-8 pb-0">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-white font-[family-name:var(--font-display)] uppercase tracking-[2px] text-lg">
                    Navigation
                  </SheetTitle>
                  <SheetClose
                    className={cn(
                      "relative h-10 w-10 rounded-full bg-[#1a2630] flex items-center justify-center cursor-pointer",
                      "transition-all duration-200 hover:bg-[#253a49] active:scale-[0.92]",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
                    )}
                    style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                  >
                    <span className="block h-[2px] w-[14px] rounded-full bg-white rotate-45 absolute" />
                    <span className="block h-[2px] w-[14px] rounded-full bg-white -rotate-45 absolute" />
                    <span className="sr-only">Close</span>
                  </SheetClose>
                </div>
                <div className="h-px bg-gradient-to-r from-[#94fcff]/30 via-[#94fcff]/10 to-transparent mt-6" />
              </SheetHeader>

              <nav className="flex-1 px-8 py-8" aria-label="Main navigation">
                <ul className="flex flex-col gap-0">
                  {NAV_LINKS.map((link, i) => (
                    <li key={link.target}>
                      {isLanding ? (
                        <SheetClose
                          className="w-full text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff] rounded"
                          onClick={() => {
                            setTimeout(() => scrollTo(link.target), 300);
                          }}
                        >
                          <div className="flex items-center justify-between py-5 border-b border-white/[0.06] group-hover:border-[#94fcff]/20 transition-colors duration-300">
                            <div className="flex items-center gap-4">
                              <span className="text-[11px] font-mono text-[#94fcff]/30 tracking-wider">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span
                                className="font-[family-name:var(--font-display)] uppercase tracking-[1px] text-white/70 group-hover:text-white transition-colors duration-200"
                                style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)" }}
                              >
                                {link.label}
                              </span>
                            </div>
                            <ArrowUpRight
                              size={16}
                              className="text-[#94fcff]/0 group-hover:text-[#94fcff]/60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </div>
                        </SheetClose>
                      ) : (
                        <SheetClose
                          className="w-full text-left cursor-pointer group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff] rounded"
                          onClick={() => {
                            window.location.href = `/#${link.target}`;
                          }}
                        >
                          <div className="flex items-center justify-between py-5 border-b border-white/[0.06] group-hover:border-[#94fcff]/20 transition-colors duration-300">
                            <div className="flex items-center gap-4">
                              <span className="text-[11px] font-mono text-[#94fcff]/30 tracking-wider">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span
                                className="font-[family-name:var(--font-display)] uppercase tracking-[1px] text-white/70 group-hover:text-white transition-colors duration-200"
                                style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)" }}
                              >
                                {link.label}
                              </span>
                            </div>
                            <ArrowUpRight
                              size={16}
                              className="text-[#94fcff]/0 group-hover:text-[#94fcff]/60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                          </div>
                        </SheetClose>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="px-8 pb-8">
                <div className="h-px bg-gradient-to-r from-[#94fcff]/30 via-[#94fcff]/10 to-transparent mb-6" />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-mono uppercase tracking-[2px] text-white/30">
                    &copy; 2026 NexApex
                  </p>
                  <div className="flex gap-4">
                    {SOCIALS.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-white/40 hover:text-white/80 transition-colors duration-200 cursor-pointer"
                      >
                        {s.label.split(" ")[0]}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
