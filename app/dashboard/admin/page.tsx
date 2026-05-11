"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Wallet, Users, Briefcase, UsersRound, BookOpen, FileSignature, FileCheck, FileSearch, UsersIcon } from "lucide-react";
import type { AdminDashboard, MonthlyRevenueRow } from "@/lib/types";

function fmt(n: number) {
  if (n >= 1_000_000) return `BWP ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `BWP ${(n / 1_000).toFixed(0)}K`;
  return `BWP ${n}`;
}

function num(n: number) {
  return n.toLocaleString();
}

export default function AdminOverviewPage() {
  const { tokens } = useAuth();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [chartData, setChartData] = useState<MonthlyRevenueRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokens) return;
    Promise.all([
      apiFetch<AdminDashboard>("/admins/dashboard/", { token: tokens.access }),
      apiFetch<MonthlyRevenueRow[]>("/admins/revenue/breakdown/", { token: tokens.access }),
    ])
      .then(([d, chart]) => {
        setData(d);
        setChartData(chart.slice(0, 6).reverse());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tokens]);

  const stats = data
    ? [
        { icon: <Wallet className="w-4 h-4" />, label: "Earnings This Month", value: fmt(Number(data.gmv_monthly)), color: "bg-violet-50 text-violet-600" },
        { icon: <Users className="w-4 h-4" />, label: "Active Students", value: num(data.active_students), color: "bg-orange-50 text-orange-600" },
        { icon: <Briefcase className="w-4 h-4" />, label: "Active Tutors", value: num(data.active_tutors), color: "bg-green-50 text-green-600" },
        { icon: <UsersRound className="w-4 h-4" />, label: "Active Parents", value: num(data.active_parents), color: "bg-blue-50 text-blue-600" },
        { icon: <BookOpen className="w-4 h-4" />, label: "Published Courses", value: num(data.published_courses), color: "bg-amber-50 text-amber-600" },
      ]
    : [];

  const actions = data
    ? [
        {
          icon: <FileSignature className="w-4 h-4 text-neutral-600" />,
          title: "Tutor Applications",
          desc: `${data.pending_tutor_applications} awaiting review`,
          badge: data.pending_tutor_applications > 0 ? String(data.pending_tutor_applications) : null,
          badgeColor: "red" as const,
          href: "/dashboard/admin/applications",
        },
        {
          icon: <FileCheck className="w-4 h-4 text-neutral-600" />,
          title: "Content Reviews",
          desc: `${data.pending_courses} courses · ${data.pending_study_guides} guides · ${data.pending_live_classes} live pending`,
          badge:
            data.pending_courses +
              data.pending_study_guides +
              data.pending_live_classes >
            0
              ? String(
                  data.pending_courses +
                    data.pending_study_guides +
                    data.pending_live_classes
                )
              : null,
          badgeColor: "orange" as const,
          href: "/dashboard/admin/content",
        },
        {
          icon: <FileSearch className="w-4 h-4 text-neutral-600" />,
          title: "Study Guides",
          desc: `${data.pending_study_guides} pending review`,
          badge: data.pending_study_guides > 0 ? String(data.pending_study_guides) : null,
          badgeColor: "amber" as const,
          href: "/dashboard/admin/content",
        },
        {
          icon: <BookOpen className="w-4 h-4 text-neutral-600" />,
          title: "Live Sessions",
          desc: `${data.pending_live_classes} pending review`,
          badge:
            data.pending_live_classes > 0
              ? String(data.pending_live_classes)
              : null,
          badgeColor: "violet" as const,
          href: "/dashboard/admin/content",
        },
        {
          icon: <UsersIcon className="w-4 h-4 text-neutral-600" />,
          title: "Total Users",
          desc: `${num(data.total_users)} registered`,
          badge: null,
          badgeColor: "green" as const,
          href: "/dashboard/admin/users",
        },
      ]
    : [];

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
      <div className="text-center py-24 text-sm text-neutral-400">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">Platform Overview</h2>
        <p className="text-[.875rem] text-neutral-500 mt-1">Real-time platform and subscription data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center text-base mb-2`}>
              {s.icon}
            </div>
            <div className="text-[1.35rem] font-extrabold tracking-tight">{s.value}</div>
            <div className="text-[.75rem] text-neutral-500 mb-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[.9rem] font-bold">Monthly Revenue</div>
            <Link href="/dashboard/admin/revenue" className="text-xs text-violet-600 hover:underline font-medium">
              View Details →
            </Link>
          </div>
          <div className="flex items-end gap-2 h-[180px]">
            {(() => {
              const maxGmv = Math.max(...chartData.map((r) => Number(r.gmv)), 1);
              return chartData.map((row) => {
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

      {/* Summary + Pending actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Summary Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[.9rem] font-bold">Platform Summary</div>
            <Badge variant="violet">{num(data.total_transactions)} transactions</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="text-2xl font-extrabold">{num(data.total_users)}</div>
              <div className="text-xs text-neutral-500 mt-1">Total Registered Users</div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="text-2xl font-extrabold">{num(data.active_students)}</div>
              <div className="text-xs text-neutral-500 mt-1">Active Students</div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="text-2xl font-extrabold">{num(data.active_tutors)}</div>
              <div className="text-xs text-neutral-500 mt-1">Active Tutors</div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="text-2xl font-extrabold">{num(data.active_parents)}</div>
              <div className="text-xs text-neutral-500 mt-1">Active Parents</div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="text-2xl font-extrabold">{num(data.published_courses)}</div>
              <div className="text-xs text-neutral-500 mt-1">Published Courses</div>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <div className="text-[.9rem] font-bold mb-3.5">Pending Actions</div>
          <div className="flex flex-col gap-2.5">
            {actions.map((a) => {
              const inner = (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-base shrink-0">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[.82rem] font-semibold">{a.title}</div>
                    <div className="text-[.73rem] text-neutral-500">{a.desc}</div>
                  </div>
                  {a.badge && <Badge variant={a.badgeColor}>{a.badge}</Badge>}
                </div>
              );
              return a.href ? (
                <Link key={a.title} href={a.href} className="no-underline text-inherit">
                  {inner}
                </Link>
              ) : (
                <div key={a.title}>{inner}</div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
