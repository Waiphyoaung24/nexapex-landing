"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiPost } from "@/lib/api";
import { setAdminToken } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

type Mode = "lead" | "admin";

export function EmailGateForm() {
  const [mode, setMode] = useState<Mode>("lead");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  function switchMode(next: Mode) {
    if (loading) return;
    setMode(next);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "admin") {
        const res = await apiPost<{
          token: string;
          email: string;
          role: string;
        }>("/admin/login", {
          email: adminEmail,
          password: adminPassword,
        });
        setAdminToken(res.token);
        router.push("/demos");
        return;
      }

      const res = await apiPost<{
        token: string;
        email: string;
        name: string;
      }>("/auth/signup", {
        email,
        name,
        company: company || undefined,
        industry: industry || undefined,
      });
      login(res.token, res.email, res.name);
      router.push("/demos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "rounded-lg bg-nex-surface border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-nex-dim/50 focus:border-[#94fcff]/30 focus:outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
      <div
        role="tablist"
        aria-label="Sign-in mode"
        className="grid grid-cols-2 gap-1 rounded-full bg-white/[0.04] p-1 border border-white/[0.06]"
      >
        {(["lead", "admin"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={cn(
              "rounded-full px-4 py-2 text-[11px] font-mono uppercase tracking-[2px] transition-colors",
              mode === m
                ? "bg-[#94fcff] text-[#0e1418]"
                : "text-white/60 hover:text-white",
            )}
          >
            {m === "lead" ? "Lead" : "Admin"}
          </button>
        ))}
      </div>

      {mode === "lead" ? (
        <>
          <input
            type="email"
            required
            placeholder="Email address *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            required
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Company name (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          />
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className={inputClass}
          >
            <option value="">Industry (optional)</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="fnb">Food &amp; Beverage</option>
            <option value="retail">Retail</option>
            <option value="agriculture">Agriculture</option>
            <option value="technology">Technology</option>
            <option value="other">Other</option>
          </select>
        </>
      ) : (
        <>
          <input
            type="email"
            required
            placeholder="Admin email *"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            autoComplete="username"
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Password *"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-[#94fcff] px-6 py-3 text-sm font-mono font-medium uppercase tracking-wider text-[#0e1418] hover:bg-[#b0fdff] disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
      >
        {loading
          ? mode === "admin"
            ? "Signing in..."
            : "Signing up..."
          : mode === "admin"
            ? "Sign in"
            : "Try Our AI"}
      </button>

      <p className="text-[10px] text-white/30 text-center">
        {mode === "admin"
          ? "Authorized personnel only."
          : "Your data is never shared. Uploads auto-delete in 1 hour."}
      </p>
    </form>
  );
}
