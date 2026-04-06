# Studio Pages Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle all AI Studio pages to match the landing page's premium brand identity — brand tokens, grain overlay, GSAP entrance animations on hub, full-width immersive demo pages.

**Architecture:** Component-level polish of existing files. No new layout abstractions. GSAP `useGSAP` hook for mount animations on the demo hub. CSS-only transitions elsewhere. Grain overlay via existing `grain-overlay` class.

**Tech Stack:** Next.js 16.2, React 19, GSAP 3.14 (`useGSAP`, `ScrollTrigger`), Tailwind 4, existing CSS tokens from `src/styles/globals.css`

**Design doc:** `docs/plans/2026-04-07-studio-redesign-design.md`

---

### Task 1: Add grain overlay to studio layout

**Files:**
- Modify: `src/app/(studio)/layout.tsx:32`

**Step 1: Add grain-overlay class**

In `src/app/(studio)/layout.tsx`, change the `<body>` tag:

```tsx
// FROM:
<body className="min-h-full bg-[#0e1418] text-[#f0f1ef]">

// TO:
<body className="grain-overlay min-h-full bg-[#0e1418] text-[#f0f1ef]">
```

**Step 2: Verify visually**

Run: `npm run dev`
Navigate to `http://localhost:3000/demos` — confirm subtle film grain overlay is visible (same as landing page).

**Step 3: Commit**

```bash
git add src/app/(studio)/layout.tsx
git commit -m "style: add grain overlay to studio layout"
```

---

### Task 2: Restyle StudioHeader with glass-header and GSAP

**Files:**
- Modify: `src/components/studio/StudioHeader.tsx`

**Step 1: Rewrite StudioHeader**

Replace the full contents of `src/components/studio/StudioHeader.tsx`:

```tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export function StudioHeader() {
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const header = headerRef.current;
    if (!header) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.from(header, {
      y: -20,
      autoAlpha: 0,
      duration: 0.6,
      ease: "power3.out",
    });
  }, { scope: headerRef });

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 glass-header",
        "px-4 py-4 md:px-[60px]",
        "flex items-center justify-between"
      )}
    >
      <Link href="/" className="flex items-center gap-2 group">
        <img
          src="/images/Flat_white.png"
          alt="NexApex"
          width={36}
          height={36}
          className="h-7 w-7 md:h-9 md:w-9 object-contain transition-transform duration-300 group-hover:scale-105"
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        />
        <span className="text-[14px] md:text-[20px] font-bold uppercase font-[family-name:var(--font-display)] tracking-[3px] text-white">
          AI Studio
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/demos"
          className="text-[11px] font-mono uppercase tracking-[2px] text-white/60 hover:text-white transition-colors duration-200"
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          Demos
        </Link>
        <a
          href="mailto:support@nexapex.ai"
          className={cn(
            "flex items-center gap-2",
            "rounded-full bg-[#94fcff] px-5 py-2.5",
            "text-[11px] font-mono font-medium uppercase tracking-[1px] text-[#0e1418]",
            "transition-all duration-300 hover:bg-[#b0fdff] hover:shadow-[0_0_20px_rgba(148,252,255,0.2)]",
            "active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
          )}
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          Book a Call
          <ArrowUpRight size={12} />
        </a>
      </div>
    </header>
  );
}
```

**Step 2: Verify visually**

Run dev server, navigate to `/demos`. Confirm:
- Header has glassmorphism backdrop blur
- Logo matches marketing header sizing
- Fade-down animation on page load
- "Book a Call" is a cyan pill with hover glow

**Step 3: Commit**

```bash
git add src/components/studio/StudioHeader.tsx
git commit -m "style: restyle StudioHeader with glass-header and GSAP entrance"
```

---

### Task 3: Restyle Demo Hub page with gradient heading and GSAP

**Files:**
- Modify: `src/app/(studio)/demos/page.tsx`

**Step 1: Rewrite demo hub page**

Replace the full contents of `src/app/(studio)/demos/page.tsx`:

```tsx
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
      gsap.from(heading, {
        y: 40,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power4.out",
      });
    }

    if (subtitle) {
      gsap.from(subtitle, {
        y: 20,
        autoAlpha: 0,
        duration: 0.6,
        delay: 0.15,
        ease: "power3.out",
      });
    }

    if (cards.length) {
      gsap.from(cards, {
        y: 50,
        autoAlpha: 0,
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
```

**Step 2: Verify visually**

Navigate to `/demos`. Confirm:
- Heading has gradient text matching landing page headings
- Subtitle uses muted dim color
- Cards stagger-animate on page load
- Reduced motion: no animations

**Step 3: Commit**

```bash
git add src/app/(studio)/demos/page.tsx
git commit -m "style: demo hub gradient heading and GSAP stagger animations"
```

---

### Task 4: Polish DemoCard with brand tokens and hover lift

**Files:**
- Modify: `src/components/studio/DemoCard.tsx`

**Step 1: Update DemoCard styling**

Replace the full contents of `src/components/studio/DemoCard.tsx`:

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DemoCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  usageLabel: string;
  tags: string[];
}

export function DemoCard({ title, description, href, icon, usageLabel, tags }: DemoCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "demo-card group relative flex flex-col rounded-2xl p-6 md:p-8",
        "bg-nex-surface border border-white/[0.06]",
        "hover:border-[#94fcff]/20 hover:bg-nex-surface2",
        "transition-all duration-300 hover:-translate-y-0.5"
      )}
      style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#94fcff]/10 text-[#94fcff]">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
        {title}
      </h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-nex-dim">
        {description}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-[#94fcff]/5 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#94fcff]/60">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-nex-dim/50">
          {usageLabel}
        </span>
        <span
          className={cn(
            "rounded-full bg-[#94fcff] px-4 py-2",
            "text-xs font-mono font-medium uppercase tracking-wider text-[#0e1418]",
            "group-hover:bg-[#b0fdff] group-hover:shadow-[0_0_16px_rgba(148,252,255,0.15)]",
            "transition-all duration-300"
          )}
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          Try Now
        </span>
      </div>
    </Link>
  );
}
```

**Step 2: Verify visually**

Navigate to `/demos`. Confirm:
- Cards use `bg-nex-surface` (not hardcoded hex)
- Hover: card lifts `-translate-y-0.5`, border glows cyan, "Try Now" gets subtle shadow
- Description text uses `text-nex-dim`

**Step 3: Commit**

```bash
git add src/components/studio/DemoCard.tsx
git commit -m "style: DemoCard brand tokens, hover lift, and transition easing"
```

---

### Task 5: Align EmailGateForm with brand tokens

**Files:**
- Modify: `src/components/studio/EmailGateForm.tsx:43`

**Step 1: Update input class string**

In `src/components/studio/EmailGateForm.tsx`, change the `inputClass` constant (line 43):

```tsx
// FROM:
const inputClass =
  "rounded-lg bg-[#162029] border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#94fcff]/30 focus:outline-none transition-colors";

// TO:
const inputClass =
  "rounded-lg bg-nex-surface border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-nex-dim/50 focus:border-[#94fcff]/30 focus:outline-none transition-colors";
```

**Step 2: Update select styling**

The `<select>` element uses `inputClass` already, so it inherits the token change.

**Step 3: Verify visually**

Navigate to `/auth`. Confirm inputs use brand surface color and placeholder uses dim token.

**Step 4: Commit**

```bash
git add src/components/studio/EmailGateForm.tsx
git commit -m "style: align EmailGateForm inputs with brand tokens"
```

---

### Task 6: Restyle demo pages with full-width immersive layout

**Files:**
- Modify: `src/app/(studio)/demos/vision/page.tsx`
- Modify: `src/app/(studio)/demos/chat/page.tsx`
- Modify: `src/app/(studio)/demos/docs/page.tsx`

**Step 1: Rewrite vision page**

Replace `src/app/(studio)/demos/vision/page.tsx`:

```tsx
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";

export default function VisionPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col">
      {/* Breadcrumb toolbar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:px-[60px]">
        <Link
          href="/demos"
          className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={14} />
          Demos
        </Link>
        <span className="text-nex-dim/30">/</span>
        <span className="text-[11px] font-mono uppercase tracking-[2px] text-white/80">
          Vision Inspector
        </span>
      </div>

      {/* Workspace */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Eye size={32} className="mx-auto mb-4 text-[#94fcff]/20" />
          <p className="text-sm text-nex-dim">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Rewrite chat page**

Replace `src/app/(studio)/demos/chat/page.tsx`:

```tsx
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col">
      {/* Breadcrumb toolbar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:px-[60px]">
        <Link
          href="/demos"
          className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={14} />
          Demos
        </Link>
        <span className="text-nex-dim/30">/</span>
        <span className="text-[11px] font-mono uppercase tracking-[2px] text-white/80">
          Smart Assistant
        </span>
      </div>

      {/* Workspace */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <MessageCircle size={32} className="mx-auto mb-4 text-[#94fcff]/20" />
          <p className="text-sm text-nex-dim">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Rewrite docs page**

Replace `src/app/(studio)/demos/docs/page.tsx`:

```tsx
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col">
      {/* Breadcrumb toolbar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 md:px-[60px]">
        <Link
          href="/demos"
          className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-nex-dim hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={14} />
          Demos
        </Link>
        <span className="text-nex-dim/30">/</span>
        <span className="text-[11px] font-mono uppercase tracking-[2px] text-white/80">
          Document Intelligence
        </span>
      </div>

      {/* Workspace */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <FileText size={32} className="mx-auto mb-4 text-[#94fcff]/20" />
          <p className="text-sm text-nex-dim">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Verify visually**

Navigate to each demo page. Confirm:
- Full-width layout, no max-width wrapper
- Breadcrumb bar with back arrow and mono font
- "Coming soon" centered in workspace with muted icon
- No horizontal overflow

**Step 5: Commit**

```bash
git add src/app/(studio)/demos/vision/page.tsx src/app/(studio)/demos/chat/page.tsx src/app/(studio)/demos/docs/page.tsx
git commit -m "style: full-width immersive layout with breadcrumb for demo pages"
```

---

### Task 7: Build verification

**Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 2: Fix any issues**

If build fails, fix TypeScript or import errors.

**Step 3: Final commit (if fixes needed)**

```bash
git add -u
git commit -m "fix: resolve build errors from studio redesign"
```
