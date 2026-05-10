"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEditorialReveal } from "@/lib/editorial-reveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
}

interface Paragraph {
  before: string;
  mark: string;
  after: string;
}

const PARAGRAPHS: Paragraph[] = [
  {
    before: "We don't sell models. We ship ",
    mark: "systems that run in production",
    after: " — measured, observable, and on schedule.",
  },
  {
    before: "Every engagement starts with ",
    mark: "a problem worth solving",
    after: ", then a prototype, then a deployment your team actually owns.",
  },
  {
    before: "From the factory floor to the office desk, our work runs ",
    mark: "where decisions get made",
    after: " — not in a slide deck.",
  },
  {
    before: "Built in ",
    mark: "Southeast Asia",
    after: ", for businesses that move faster than their competition.",
  },
];

export function EditorialHighlightSection({ id }: { id?: string } = {}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEditorialReveal(sectionRef);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const marks = section.querySelectorAll<HTMLElement>(".hx-marker");
      const cleanups: Array<() => void> = [];

      marks.forEach((mark) => {
        const textEl = mark.querySelector<HTMLElement>(".hx-marker__text");
        if (!textEl) return;

        if (reduceMotion) {
          gsap.set(mark, { backgroundSize: "100% 100%" });
          return;
        }

        const split = SplitText.create(textEl, { type: "words,chars" });
        gsap.set(mark, { backgroundSize: "0% 100%" });

        const animate = () => {
          gsap
            .timeline({ defaults: { duration: 0.1, ease: "sine" } })
            .to(split.chars, {
              stagger: (pos, _, arr) => 0.06 * (arr.length - 1 - pos),
              opacity: 0,
            })
            .to(split.chars, {
              stagger: (pos) => 0.2 + 0.05 * pos,
              opacity: 1,
            })
            .fromTo(
              mark,
              { backgroundSize: "0% 100%" },
              { duration: 1, ease: "power4.out", backgroundSize: "100% 100%" },
              "<",
            );
        };

        const reset = () => {
          gsap.killTweensOf([split.chars, mark]);
          gsap.set(split.chars, { opacity: 1 });
          gsap.set(mark, { backgroundSize: "0% 100%" });
        };

        const trigger = ScrollTrigger.create({
          trigger: mark,
          start: "top 80%",
          onEnter: animate,
          onEnterBack: animate,
          onLeave: reset,
          onLeaveBack: reset,
        });

        cleanups.push(() => {
          trigger.kill();
          split.revert();
        });
      });

      return () => {
        cleanups.forEach((fn) => fn());
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative bg-[#0e1418] text-white px-5 md:px-[60px] py-14 md:py-28 overflow-hidden"
    >
      {/* Header row */}
      <div className="mb-12 md:mb-24 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="editorial-index text-[10px] font-mono uppercase tracking-[4px] text-[#94fcff]/50 mb-3"
            aria-hidden="true"
          >
            02 / IN PRACTICE
          </p>
          <h2
            className="editorial-heading font-normal uppercase leading-[0.95] font-[family-name:var(--font-display)]"
            style={{
              fontSize: "clamp(1.75rem, 7vw, 3.5rem)",
              background:
                "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            How We Work
          </h2>
        </div>
        <p className="editorial-body max-w-[280px] text-[10px] font-medium uppercase tracking-[1.5px] text-white/55 md:text-right leading-[1.8]">
          A short manifesto: read it on the way down.
        </p>
      </div>

      {/* Paragraph stack — each highlight gets its own scroll beat */}
      <div>
        {PARAGRAPHS.map((p, i) => {
          const isOdd = i % 2 === 1;
          return (
          <p
            key={p.before}
            className={`editorial-body text-white/90 leading-[1.25] md:leading-[1.35] tracking-[-0.015em] font-[family-name:var(--font-display)] mb-[18vh] md:mb-[25vh] last:mb-0 max-w-[34rem] sm:max-w-[44rem] md:max-w-[52rem] lg:max-w-[62rem] ${isOdd ? "ml-auto text-right" : "mr-auto text-left"}`}
            style={{
              fontSize: "clamp(1.15rem, 3.4vw, 2.5rem)",
              textWrap: "pretty",
            }}
          >
            {p.before}
            <mark
              className="hx-marker text-white"
              style={{
                backgroundColor: "transparent",
                backgroundImage:
                  "linear-gradient(rgba(148, 252, 255, 0.22), rgba(148, 252, 255, 0.22))",
                backgroundRepeat: "no-repeat",
                backgroundSize: "0% 100%",
                backgroundPosition: isOdd ? "right center" : "left center",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
                color: "#ffffff",
                padding: "0.05em 0.18em",
                margin: "0 -0.18em",
                borderRadius: "6px",
              }}
            >
              <span className="hx-marker__text">{p.mark}</span>
            </mark>
            {p.after}
          </p>
          );
        })}
      </div>
    </section>
  );
}
