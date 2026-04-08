"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { setAdminToken } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiPost<{ token: string }>("/admin/login", {
        email,
        password,
      });
      setAdminToken(res.token);
      router.push("/admin/leads");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "rounded-lg bg-nex-surface border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-nex-dim/50 focus:border-[#94fcff]/30 focus:outline-none transition-colors w-full";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-[10px] font-mono uppercase tracking-[2px] text-nex-dim mb-2">
          NexApex Admin
        </p>
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-white mb-8">
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer rounded-lg bg-[#94fcff] px-5 py-3 text-sm font-medium text-[#0e1418] hover:bg-[#b0fdff] disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
