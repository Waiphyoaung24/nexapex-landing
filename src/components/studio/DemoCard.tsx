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
        "group relative flex flex-col rounded-2xl p-6 md:p-8",
        "bg-[#162029] border border-white/[0.06]",
        "hover:border-[#94fcff]/20 hover:bg-[#1d2d39]",
        "transition-all duration-300"
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#94fcff]/10 text-[#94fcff]">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold font-[family-name:var(--font-display)] uppercase tracking-wider text-white">
        {title}
      </h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-white/50">
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
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
          {usageLabel}
        </span>
        <span className="rounded-full bg-[#94fcff] px-4 py-2 text-xs font-mono font-medium uppercase tracking-wider text-[#0e1418] group-hover:bg-[#b0fdff] transition-colors">
          Try Now
        </span>
      </div>
    </Link>
  );
}
