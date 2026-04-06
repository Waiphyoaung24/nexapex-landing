"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiPost } from "@/lib/api";

export function EmailGateForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
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
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "rounded-lg bg-nex-surface border border-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-nex-dim/50 focus:border-[#94fcff]/30 focus:outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
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

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-[#94fcff] px-6 py-3 text-sm font-mono font-medium uppercase tracking-wider text-[#0e1418] hover:bg-[#b0fdff] disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#94fcff]"
      >
        {loading ? "Signing up..." : "Try Our AI"}
      </button>

      <p className="text-[10px] text-white/30 text-center">
        Your data is never shared. Uploads auto-delete in 1 hour.
      </p>
    </form>
  );
}
