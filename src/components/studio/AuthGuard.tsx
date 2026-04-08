"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api";
import { PendingScreen } from "./PendingScreen";

interface MeResponse {
  id: string;
  email: string;
  name: string;
  is_approved: boolean;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, hydrated } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "approved" | "pending">(
    "loading",
  );

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }

    apiGet<MeResponse>("/auth/me", token!)
      .then((me) => {
        setStatus(me.is_approved ? "approved" : "pending");
      })
      .catch(() => {
        router.replace("/auth");
      });
  }, [hydrated, isAuthenticated, token, router]);

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
