"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Users, BookOpen, Star, Book, Video, MonitorPlay, FileText, LayoutDashboard } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import type { TutorDashboard, MonthlyRevenue, PaginatedResponse } from "@/lib/types";

interface TopCourse {
  id: number;
  title: string;
  slug: string;
  student_count: number;
  revenue: string;
  average_rating: number | null;
}

interface TutorReview {
  id: number;
  student_name: string;
  course_title: string;
  rating: number;
  comment: string;
  created_at: string;
}

function fmt(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return `BWP ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function TutorOverviewPage() {
  const { tokens, profile } = useAuth();
  const toast = useToast();
  const [dashboard, setDashboard] = useState<TutorDashboard | null>(null);
  const [chart, setChart] = useState<MonthlyRevenue[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const [dash, chartData, top, rev] = await Promise.all([
        apiFetch<TutorDashboard>("/tutors/dashboard/", { token: tokens.access }),
        apiFetch<MonthlyRevenue[]>("/tutors/revenue-chart/", { token: tokens.access }),
        apiFetch<TopCourse[]>("/tutors/top-courses/", { token: tokens.access }),
        apiFetch<PaginatedResponse<TutorReview>>("/tutors/recent-reviews/", { token: tokens.access }),
      ]);
      setDashboard(dash);
      setChart(chartData);
      setTopCourses(top);
      setReviews(rev.results.slice(0, 3));
    } catch {
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <p className="text-sm text-neutral-400">Unable to load dashboard.</p>
        <Button variant="primary" size="sm" className="mt-3" onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const displayName = profile?.first_name || "Tutor";

  const stats = [
    { icon: <Wallet className="w-4 h-4" />, label: "Monthly Earnings", value: fmt(dashboard.monthly_earnings), color: "bg-orange-50 text-orange-600" },
    { icon: <Users className="w-4 h-4" />, label: "Active Students", value: String(dashboard.active_students), color: "bg-violet-50 text-violet-600" },
    { icon: <BookOpen className="w-4 h-4" />, label: "Published Courses", value: String(dashboard.published_courses), color: "bg-green-50 text-green-600" },
    { icon: <Star className="w-4 h-4" />, label: "Avg Rating", value: dashboard.average_rating ? String(dashboard.average_rating) : "—", color: "bg-amber-50 text-amber-600" },
  ];

  const peakRevenue = Math.max(...chart.map((m) => parseFloat(m.revenue)), 1);
  const courseIcons = [
    <Book key="1" className="w-4 h-4" />,
    <Video key="2" className="w-4 h-4" />,
    <MonitorPlay key="3" className="w-4 h-4" />,
    <FileText key="4" className="w-4 h-4" />,
    <LayoutDashboard key="5" className="w-4 h-4" />
  ];
  const colors = ["bg-violet-50", "bg-blue-50", "bg-orange-50", "bg-green-50", "bg-amber-50"];
  const reviewColors = ["bg-violet-600", "bg-green-600", "bg-orange-600"];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Welcome back, {displayName}
        </h2>
        <p className="text-[.875rem] text-neutral-500 mt-1">
          Here&apos;s how your content is performing this month.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
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

      {/* Revenue chart + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-[.9rem] font-bold mb-4">Monthly Revenue</div>
          {chart.length === 0 ? (
            <div className="h-[140px] flex items-center justify-center text-sm text-neutral-400">
              No revenue data yet.
            </div>
          ) : (
            <div className="flex items-end gap-3 h-[140px]">
              {chart.map((d, i) => {
                const rev = parseFloat(d.revenue);
                const barH = Math.max((rev / peakRevenue) * 96, 4);
                const isLast = i === chart.length - 1;
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="text-[.65rem] font-semibold text-neutral-500"
                      style={isLast ? { color: "var(--color-violet-600)", fontWeight: 700 } : undefined}
                    >
                      {fmt(rev)}
                    </div>
                    <div className="w-full flex items-end justify-center flex-1">
                      <div
                        className="w-full rounded-lg"
                        style={{
                          height: `${barH}px`,
                          background: isLast
                            ? "linear-gradient(to top, var(--color-violet-600), var(--color-violet-400))"
                            : "var(--color-violet-100)",
                        }}
                      />
                    </div>
                    <div
                      className="text-[.7rem] font-medium text-neutral-500"
                      style={isLast ? { color: "var(--color-violet-600)", fontWeight: 700 } : undefined}
                    >
                      {new Date(d.month + "-01").toLocaleString("default", { month: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3.5">
          {/* Top Performing */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className="text-[.9rem] font-bold mb-3.5">Top Performing</div>
            {topCourses.length === 0 ? (
              <p className="text-[.8rem] text-neutral-400">No courses yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {topCourses.slice(0, 3).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${colors[i % colors.length]} flex items-center justify-center text-base shrink-0`}>
                      {courseIcons[i % courseIcons.length]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[.8rem] font-semibold truncate">{c.title}</div>
                      <div className="text-[.72rem] text-neutral-500">
                        {c.student_count} students · {fmt(c.revenue)}/mo
                      </div>
                    </div>
                    {c.average_rating && (
                      <Badge variant={i === 2 ? "orange" : "violet"}>
                        {c.average_rating}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4">
            <div className="text-[.9rem] font-bold mb-3.5">Recent Reviews</div>
            {reviews.length === 0 ? (
              <p className="text-[.8rem] text-neutral-400">No reviews yet.</p>
            ) : (
              <div className="flex flex-col">
                {reviews.map((r, i) => {
                  const initials = r.student_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center gap-2.5 py-2.5 ${i < reviews.length - 1 ? "border-b border-neutral-200" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full ${reviewColors[i % reviewColors.length]} text-white flex items-center justify-center text-[.65rem] font-bold shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[.8rem] font-semibold">{r.student_name}</div>
                        <div className="text-[.75rem] text-neutral-500 truncate">
                          {r.comment ? `"${r.comment}"` : r.course_title}
                        </div>
                      </div>
                      <div className="text-[.78rem] text-amber-500 font-bold">{r.rating}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
