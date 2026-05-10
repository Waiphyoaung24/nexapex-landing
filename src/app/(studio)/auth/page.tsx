import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { EmailGateForm } from "@/components/studio/EmailGateForm";

export const metadata: Metadata = {
  title: "Sign in — NexApex AI Studio",
  description: "Access NexApex AI Studio demos with your work email.",
};

export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <Link
        href="/"
        aria-label="Back to home"
        className="group absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[11px] font-mono uppercase tracking-[2px] text-white/60 transition-colors hover:border-[#94fcff]/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
      >
        <ArrowLeft
          size={12}
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        Back
      </Link>

      <div className="w-full max-w-md text-center">
        <Image
          src="/images/Flat_white.png"
          alt="NexApex"
          width={48}
          height={48}
          className="mx-auto mb-6 size-12"
          priority
        />
        <h1 className="mb-2 text-2xl font-semibold font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
          AI Solutions Studio
        </h1>
        <p className="mb-8 text-sm text-white/50">
          Try real AI demos: computer vision, smart chat, and document
          intelligence.
        </p>
        <EmailGateForm />
      </div>
    </div>
  );
}
