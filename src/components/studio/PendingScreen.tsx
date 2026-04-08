"use client";

import { Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function PendingScreen() {
  const { name, logout } = useAuth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#94fcff]/10">
          <Clock size={28} className="text-[#94fcff]" />
        </div>

        <h2 className="text-2xl font-[family-name:var(--font-display)] text-white mb-3">
          Thanks{name ? `, ${name}` : ""}!
        </h2>

        <p className="text-sm leading-relaxed text-nex-text/60 mb-6">
          Your access request is under review. Our team will approve your
          account shortly. Refresh this page to check your status.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded-lg bg-[#94fcff] px-5 py-2.5 text-xs font-medium text-[#0e1418] transition-colors hover:bg-[#b0fdff]"
          >
            Refresh status
          </button>
          <button
            type="button"
            onClick={logout}
            className="cursor-pointer text-xs text-nex-dim hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
