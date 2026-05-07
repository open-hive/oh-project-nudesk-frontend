"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Wallet, BookOpen, Repeat } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import type { TutorEarnings } from "@/lib/types";

function fmt(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return `BWP ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TutorEarningsPage() {
  const { tokens } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<TutorEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await apiFetch<TutorEarnings>("/tutors/earnings/", {
        token: tokens.access,
      });
      setData(res);
    } catch {
      toast.error("Failed to load earnings.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <p className="text-sm text-neutral-400">Unable to load earnings data.</p>
        <Button variant="primary" size="sm" className="mt-3" onClick={fetchEarnings}>
          Retry
        </Button>
      </div>
    );
  }

  const stats = [
    { icon: <CalendarDays className="w-4 h-4" />, label: "This Month", value: fmt(data.monthly_earnings), color: "bg-orange-50 text-orange-600" },
    { icon: <Wallet className="w-4 h-4" />, label: "Total Earnings", value: fmt(data.total_earnings), color: "bg-green-50 text-green-600" },
    { icon: <Repeat className="w-4 h-4" />, label: "Subscription Revenue", value: fmt(data.subscription_revenue), color: "bg-violet-50 text-violet-600" },
    { icon: <BookOpen className="w-4 h-4" />, label: "Subscription Payments", value: String(data.subscription_transactions), color: "bg-blue-50 text-blue-600" },
  ];

  // Find peak month revenue for chart bar scaling
  const peakRevenue = Math.max(
    ...data.monthly_chart.map((m) => parseFloat(m.revenue)),
    1
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">Earnings</h2>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center text-base mb-2`}>
              {s.icon}
            </div>
            <div className="text-[1.35rem] font-extrabold tracking-tight">{s.value}</div>
            <div className="text-[.75rem] text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {data.monthly_chart.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden mb-5">
          <div className="px-4 py-4 border-b-[1.5px] border-neutral-200 text-[.875rem] font-bold">
            Monthly Revenue
          </div>
          <div className="px-4 py-5">
            <div className="flex items-end gap-2 h-40">
              {data.monthly_chart.map((m) => {
                const rev = parseFloat(m.revenue);
                const barH = Math.max((rev / peakRevenue) * 110, 4);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[.65rem] font-semibold text-neutral-600">{fmt(rev)}</span>
                    <div className="w-full flex justify-center items-end flex-1">
                      <div
                        className="w-full max-w-[40px] bg-violet-500 rounded-t-md transition-all"
                        style={{ height: `${barH}px` }}
                      />
                    </div>
                    <span className="text-[.6rem] text-neutral-400">
                      {new Date(m.month + "-01").toLocaleString("default", { month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Per-course Revenue */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-4 border-b-[1.5px] border-neutral-200 text-[.875rem] font-bold">
          Course Library Performance
        </div>
        {data.per_course.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">
            No subscriber activity has reached your courses yet.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Course</th>
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Students</th>
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Attributed Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.per_course.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-b-0">
                  <td className="px-4 py-3 text-[.875rem] font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-[.875rem]">
                    <Badge variant="blue">{c.student_count}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[.875rem] font-bold">{fmt(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
