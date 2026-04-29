"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Shield, LogOut } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { getAdminToken, clearAdminToken } from "@/lib/admin-auth";
import { useAuth } from "@/lib/auth-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export function StudioHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { logout, hydrated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    setIsAdmin(getAdminToken() !== null);
  }, [hydrated]);

  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.set(header, { y: -20, autoAlpha: 0 });
      gsap.to(header, {
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        ease: "power3.out",
      });
    },
    { scope: headerRef },
  );

  function handleSignOut() {
    clearAdminToken();
    logout();
    setIsAdmin(false);
    router.push("/auth");
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 glass-header",
        "px-4 py-4 md:px-[60px]",
        "flex items-center justify-between",
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

        {isAdmin && (
          <>
            <Link
              href="/admin/leads"
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-[#94fcff] hover:text-[#b0fdff] transition-colors"
            >
              <Shield size={12} />
              Admin
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[2px] text-white/60 hover:text-white transition-colors"
            >
              <LogOut size={12} />
              Sign out
            </button>
          </>
        )}

        {!isAdmin && (
          <a
            href="mailto:support@nexapex.ai"
            className={cn(
              "flex items-center gap-2",
              "rounded-full bg-[#94fcff] px-5 py-2.5",
              "text-[11px] font-mono font-medium uppercase tracking-[1px] text-[#0e1418]",
              "transition-all duration-300 hover:bg-[#b0fdff] hover:shadow-[0_0_20px_rgba(148,252,255,0.2)]",
              "active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]",
            )}
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            Book a Call
            <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </header>
  );
}
