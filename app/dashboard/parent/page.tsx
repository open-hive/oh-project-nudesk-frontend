"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  BookOpen,
  Award,
  CreditCard,
  Loader2,
  ChevronRight,
  TrendingUp,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { parentApi } from "@/lib/api";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { ParentDashboard, ChildSummary } from "@/lib/types";

export default function ParentOverviewPage() {
  const { user, tokens } = useAuth();
  const [dash, setDash] = useState<ParentDashboard | null>(null);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const [d, c] = await Promise.all([
        parentApi.getDashboard(tokens.access),
        parentApi.getChildren(tokens.access),
      ]);
      setDash(d);
      setChildren(c);
    } finally {
      setLoading(false);
    }
  }, [tokens]);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = user?.username ?? "Parent";

  if (loading || !dash) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: "Linked Children",
      value: dash.children_count,
      icon: <Users className="w-5 h-5 text-orange-500" />,
      bg: "bg-orange-50",
    },
    {
      label: "Courses Enrolled",
      value: dash.total_enrolled,
      icon: <BookOpen className="w-5 h-5 text-violet-500" />,
      bg: "bg-violet-50",
    },
    {
      label: "Certificates Earned",
      value: dash.total_certs,
      icon: <Award className="w-5 h-5 text-green-500" />,
      bg: "bg-green-50",
    },
    {
      label: "Total Spent",
      value: `BWP ${parseFloat(dash.total_spent).toLocaleString("en-BW", {
        minimumFractionDigits: 2,
      })}`,
      icon: <CreditCard className="w-5 h-5 text-amber-500" />,
      bg: "bg-amber-50",
    },
  ];

  const activityItems = children
    .filter((c) => c.latest_activity)
    .slice(0, 5)
    .map((c) => ({
      name: `${c.first_name} ${c.last_name}`,
      message: c.latest_activity!,
      childId: c.child_id,
    }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">
          Welcome back, {firstName}
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Here&apos;s a snapshot of your children&apos;s learning progress.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm flex flex-col gap-3"
          >
            <div
              className={`${s.bg} w-9 h-9 rounded-xl flex items-center justify-center`}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{s.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Children at a Glance */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[1.1rem] font-extrabold tracking-[-0.02em] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Children at a Glance
          </h3>
          <Link
            href="/dashboard/parent/children"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="bg-white border border-neutral-100 rounded-2xl p-8 text-center shadow-sm">
            <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No linked children yet.</p>
            <Link
              href="/dashboard/parent/children"
              className="mt-3 inline-block text-xs font-semibold text-orange-600 hover:underline"
            >
              Link a child →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {children.slice(0, 6).map((child) => (
              <Link
                key={child.child_id}
                href={`/dashboard/parent/children/${child.child_id}`}
                className="bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {child.first_name[0]}
                    {child.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm truncate">
                      {child.first_name} {child.last_name}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      {child.email}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300 ml-auto group-hover:text-orange-500 transition-colors flex-shrink-0" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Progress</span>
                    <span className="font-semibold text-neutral-700">
                      {Math.round(child.avg_progress ?? 0)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={child.avg_progress ?? 0}
                    color="orange"
                  />
                </div>

                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                  <span>
                    <span className="font-semibold text-neutral-700">
                      {child.enrolled_courses}
                    </span>{" "}
                    courses
                  </span>
                  <span>
                    <span className="font-semibold text-neutral-700">
                      {child.certificates_earned}
                    </span>{" "}
                    certs
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm">
        <h3 className="text-[1.1rem] font-extrabold tracking-[-0.02em] flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-violet-500" />
          Recent Activity
        </h3>
        {activityItems.length === 0 ? (
          <p className="text-sm text-neutral-400">
            No recent activity to show.
          </p>
        ) : (
          <ul className="space-y-3">
            {activityItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[.65rem] font-bold flex-shrink-0 mt-0.5">
                  {item.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm text-neutral-800">
                    <span className="font-semibold">{item.name}</span>{" "}
                    {item.message}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
