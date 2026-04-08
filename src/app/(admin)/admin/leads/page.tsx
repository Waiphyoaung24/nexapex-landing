"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { apiGet, apiPatch } from "@/lib/api";
import { getAdminToken, clearAdminToken } from "@/lib/admin-auth";

interface Lead {
  id: string;
  email: string;
  name: string;
  company: string | null;
  industry: string | null;
  is_approved: boolean;
  created_at: string;
}

type Filter = "all" | "pending" | "approved";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const token = getAdminToken();

  const fetchLeads = useCallback(async () => {
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const res = await apiGet<{ leads: Lead[]; total: number }>(
        `/admin/leads?status=${filter}`,
        token,
      );
      setLeads(res.leads);
      setTotal(res.total);
    } catch {
      clearAdminToken();
      router.replace("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [token, filter, router]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  async function handleApprove(leadId: string) {
    if (!token) return;
    await apiPatch(`/admin/leads/${leadId}/approve`, undefined, token);
    fetchLeads();
  }

  const filters: { label: string; value: Filter }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[2px] text-nex-dim">
            Admin
          </p>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-white">
            Leads
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-nex-dim">{total} total</span>
          <button
            type="button"
            onClick={() => {
              clearAdminToken();
              router.replace("/admin/login");
            }}
            className="cursor-pointer text-xs text-nex-dim hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-1 rounded-lg bg-nex-surface p-1">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`cursor-pointer rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-white/10 text-white"
                : "text-nex-dim hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#94fcff]/20 border-t-[#94fcff]" />
        </div>
      ) : leads.length === 0 ? (
        <p className="py-12 text-center text-sm text-nex-dim">
          No leads found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-[2px] text-nex-dim">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 hidden sm:table-cell">Company</th>
                <th className="px-4 py-3 hidden md:table-cell">Industry</th>
                <th className="px-4 py-3 hidden md:table-cell">Signed Up</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-white/90">{lead.name}</td>
                  <td className="px-4 py-3 text-nex-text/70">{lead.email}</td>
                  <td className="px-4 py-3 text-nex-dim hidden sm:table-cell">
                    {lead.company || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-nex-dim hidden md:table-cell capitalize">
                    {lead.industry || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-nex-dim hidden md:table-cell">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {lead.is_approved ? (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                        Approved
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!lead.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove(lead.id)}
                        className="cursor-pointer flex items-center gap-1 rounded-md bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Check size={12} />
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
