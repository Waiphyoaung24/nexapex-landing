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
        "transition-all duration-300 hover:-translate-y-0.5",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]/60 focus-visible:rounded-2xl"
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
