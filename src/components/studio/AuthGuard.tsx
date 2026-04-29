"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api";
import { getAdminToken, clearAdminToken } from "@/lib/admin-auth";
import { PendingScreen } from "./PendingScreen";

interface MeResponse {
  id: string;
  email: string;
  name: string;
  is_approved: boolean;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token: leadToken, hydrated, logout } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "approved" | "pending">(
    "loading",
  );

  useEffect(() => {
    if (!hydrated) return;

    const adminToken = getAdminToken();
    const activeToken = adminToken ?? leadToken;

    if (!activeToken) {
      router.replace("/auth");
      return;
    }

    apiGet<MeResponse>("/auth/me", activeToken)
      .then((me) => {
        setStatus(me.is_approved ? "approved" : "pending");
      })
      .catch(() => {
        if (adminToken) clearAdminToken();
        if (leadToken) logout();
        router.replace("/auth");
      });
  }, [hydrated, leadToken, router, logout]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#94fcff]/20 border-t-[#94fcff]" />
      </div>
    );
  }

  if (status === "pending") {
    return <PendingScreen />;
  }

  return <>{children}</>;
}
