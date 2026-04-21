"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { AdminRevenueOverview, MonthlyRevenueRow } from "@/lib/types";

function fmt(n: number) {
  if (n >= 1_000_000) return `P${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `P${(n / 1_000).toFixed(1)}K`;
  return `P${n.toFixed(2)}`;
}

export default function AdminRevenuePage() {
  const { tokens } = useAuth();
  const toast = useToast();
  const [overview, setOverview] = useState<AdminRevenueOverview | null>(null);
  const [breakdown, setBreakdown] = useState<MonthlyRevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!tokens) return;
    Promise.all([
      apiFetch<AdminRevenueOverview>("/admins/revenue/overview/", { token: tokens.access }),
      apiFetch<MonthlyRevenueRow[]>("/admins/revenue/breakdown/", { token: tokens.access }),
    ])
      .then(([ov, bd]) => {
        setOverview(ov);
        setBreakdown(bd);
      })
      .catch(() => toast.error("Failed to load revenue data."))
      .finally(() => setLoading(false));
  }, [tokens, toast]);

  const handleExport = useCallback(async () => {
    if (!tokens) return;
    setExporting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/apis"}/admins/revenue/export/`,
        { headers: { Authorization: `Bearer ${tokens.access}` } }
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "revenue_export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Revenue data exported.");
    } catch {
      toast.error("Failed to export revenue data.");
    } finally {
      setExporting(false);
    }
  }, [tokens, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-24 text-sm text-neutral-400">
        Failed to load revenue data.
      </div>
    );
  }

  const stats = [
    { icon: "💰", label: "GMV This Month", value: fmt(Number(overview.gmv_monthly)), sub: `YTD: ${fmt(Number(overview.gmv_ytd))}`, color: "bg-violet-50" },
    { icon: "💸", label: "Platform Commission", value: fmt(Number(overview.commission_monthly)), sub: `YTD: ${fmt(Number(overview.commission_ytd))}`, color: "bg-orange-50" },
    { icon: "📈", label: "YTD GMV", value: fmt(Number(overview.gmv_ytd)), sub: `${overview.total_transactions.toLocaleString()} transactions`, color: "bg-green-50" },
    { icon: "👤", label: "Avg Revenue / User", value: overview.avg_revenue_per_user ? `P${Number(overview.avg_revenue_per_user).toFixed(2)}` : "—", sub: `+${overview.new_students_monthly} students this month`, color: "bg-amber-50" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">Revenue</h2>
        <Button variant="secondary" size="sm" icon={Download} loading={exporting} onClick={handleExport}>
          Export
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center text-base mb-2`}>
              {s.icon}
            </div>
            <div className="text-[1.35rem] font-extrabold tracking-tight">{s.value}</div>
            <div className="text-[.75rem] text-neutral-500 mb-1">{s.label}</div>
            <div className="text-[.72rem] font-semibold text-green-600 bg-green-50 rounded-full px-2 py-0.5 w-fit">
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 mb-5">
          <div className="text-[.9rem] font-bold mb-4">Revenue Trend</div>
          <div className="flex items-end gap-2 h-[180px]">
            {(() => {
              const rows = breakdown.slice(0, 12).reverse();
              const maxGmv = Math.max(...rows.map((r) => Number(r.gmv)), 1);
              return rows.map((row) => {
                const barH = Math.max((Number(row.gmv) / maxGmv) * 130, 4);
                const label = new Date(row.month + "-01").toLocaleDateString("en-US", { month: "short" });
                return (
                  <div key={row.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[.65rem] font-bold text-neutral-600">{fmt(Number(row.gmv))}</div>
                    <div className="w-full flex justify-center items-end flex-1">
                      <div
                        className="w-full max-w-[48px] bg-violet-500 rounded-t-md transition-all"
                        style={{ height: `${barH}px` }}
                      />
                    </div>
                    <div className="text-[.65rem] text-neutral-500 font-medium">{label}</div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Revenue Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-4 border-b-[1.5px] border-neutral-200 flex items-center justify-between">
          <div className="text-[.875rem] font-bold">Monthly Revenue Breakdown</div>
          <Badge variant="violet">{breakdown.length} months</Badge>
        </div>
        {breakdown.length === 0 ? (
          <div className="text-center py-12 text-sm text-neutral-400">No revenue data yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Month</th>
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">GMV</th>
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Commission</th>
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Tutor Payouts</th>
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((m, i) => {
                const label = new Date(m.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" });
                return (
                  <tr key={m.month} className="border-b border-neutral-100 last:border-b-0">
                    <td className="px-4 py-3 text-[.875rem] font-semibold">{label}</td>
                    <td className={`px-4 py-3 text-[.875rem] font-bold ${i === 0 ? "text-violet-600" : ""}`}>{fmt(Number(m.gmv))}</td>
                    <td className="px-4 py-3 text-[.875rem]">{fmt(Number(m.commission))}</td>
                    <td className="px-4 py-3 text-[.875rem]">{fmt(Number(m.tutor_payouts))}</td>
                    <td className="px-4 py-3 text-[.875rem]">{m.transaction_count.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
