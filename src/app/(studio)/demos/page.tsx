"use client";

import { useRef } from "react";
import { DemoCard } from "@/components/studio/DemoCard";
import { Eye, MessageCircle, FileText } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export default function DemoHubPage() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const heading = section.querySelector(".hub-heading");
    const subtitle = section.querySelector(".hub-subtitle");
    const cards = section.querySelectorAll(".demo-card");

    if (heading) {
      gsap.set(heading, { y: 40, autoAlpha: 0 });
      gsap.to(heading, {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        ease: "power4.out",
      });
    }

    if (subtitle) {
      gsap.set(subtitle, { y: 20, autoAlpha: 0 });
      gsap.to(subtitle, {
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        delay: 0.15,
        ease: "power3.out",
      });
    }

    if (cards.length) {
      gsap.set(cards, { y: 50, autoAlpha: 0 });
      gsap.to(cards, {
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        stagger: 0.12,
        delay: 0.3,
        ease: "power4.out",
      });
    }
  }, { scope: sectionRef });

  return (
    <div ref={sectionRef} className="px-4 py-12 md:px-[60px] md:py-20">
      <div className="mb-12 text-center">
        <h1
          className="hub-heading mb-4 text-3xl md:text-5xl font-[family-name:var(--font-display)] uppercase tracking-wider"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #e8eae7 30%, #d4eef0 65%, #a0dfe4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AI Demo Hub
        </h1>
        <p className="hub-subtitle mx-auto max-w-2xl text-base text-nex-dim">
          Try real AI capabilities. Upload your own data and see results instantly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-7xl mx-auto">
        <DemoCard
          title="Vision Inspector"
          description="Upload an image or use your camera to detect objects with real-time computer vision."
          href="/demos/vision"
          icon={<Eye size={24} />}
          usageLabel="10 demos available"
          tags={["Manufacturing", "Retail", "QC"]}
        />
        <DemoCard
          title="Smart Assistant"
          description="Chat with an AI business consultant that understands Southeast Asian markets."
          href="/demos/chat"
          icon={<MessageCircle size={24} />}
          usageLabel="20 messages available"
          tags={["F&B", "Agriculture", "Tech"]}
        />
        <DemoCard
          title="Document Intelligence"
          description="Upload invoices, receipts, or documents to extract structured data automatically."
          href="/demos/docs"
          icon={<FileText size={24} />}
          usageLabel="5 documents available"
          tags={["Finance", "Admin", "Logistics"]}
        />
      </div>
    </div>
  );
}
