"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PlayCircle,
  Flame,
  Award,
  Clock,
  Play,
  Calendar,
  Loader2,
  Users,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

function getNotifStyle(type: string): { bg: string; color: string; Icon: LucideIcon } {
  if (type.startsWith("parent_link")) return { bg: "bg-orange-50", color: "text-orange-500", Icon: Users };
  if (type === "live_class_created" || type === "live_class_reminder") return { bg: "bg-violet-50", color: "text-primary", Icon: Play };
  if (type === "payment_received") return { bg: "bg-green-50", color: "text-green-600", Icon: CreditCard };
  if (type === "course_completed") return { bg: "bg-amber-50", color: "text-amber-600", Icon: Award };
  return { bg: "bg-violet-50", color: "text-primary", Icon: Calendar };
}
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import type {
  StudentDashboard,
  Enrollment,
  LiveClassRegistration,
  PaginatedResponse,
  Notification,
} from "@/lib/types";

const GRADIENTS = [
  "from-violet-50 to-violet-100",
  "from-orange-50 to-orange-100",
  "from-green-50 to-emerald-100",
  "from-amber-50 to-amber-100",
];
const COLORS: ("violet" | "orange" | "green")[] = ["violet", "orange", "green"];

export default function StudentOverviewPage() {
  const { user, tokens } = useAuth();
  const [dash, setDash] = useState<StudentDashboard | null>(null);
  const [courses, setCourses] = useState<Enrollment[]>([]);
  const [upcoming, setUpcoming] = useState<LiveClassRegistration[]>([]);
  const [activity, setActivity] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const [d, cl, reg, notifs] = await Promise.all([
        apiFetch<StudentDashboard>("/students/dashboard/", { token: tokens.access }),
        apiFetch<PaginatedResponse<Enrollment>>("/students/continue-learning/", { token: tokens.access }),
        apiFetch<PaginatedResponse<LiveClassRegistration>>(
          "/students/live-classes/",
          { token: tokens.access }
        ),
        apiFetch<PaginatedResponse<Notification>>(
          "/notifications/?limit=5",
          { token: tokens.access }
        ),
      ]);
      setDash(d);
      setCourses(cl.results);
      setUpcoming(reg.results.filter((r) => r.status === "scheduled").slice(0, 3));
      setActivity(notifs.results);
    } finally {
      setLoading(false);
    }
  }, [tokens]);

  useEffect(() => { load(); }, [load]);

  if (loading || !dash) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = user?.username ?? "Student";

  const stats = [
    {
      icon: PlayCircle,
      iconBg: "bg-violet-50 text-primary",
      value: String(dash.enrolled_courses),
      label: "Enrolled Courses",
      badge: dash.enrolled_courses > 0 ? "Active" : undefined,
    },
    {
      icon: Flame,
      iconBg: "bg-orange-50 text-accent",
      value: String(dash.learning_streak_days),
      label: "Day Streak",
    },
    {
      icon: Award,
      iconBg: "bg-green-50 text-success",
      value: String(dash.certificates_earned),
      label: "Certificates Earned",
    },
    {
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600",
      value: `${Math.round(dash.total_study_hours)}h`,
      label: "Study Hours",
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Welcome back, {firstName}
        </h2>
        {dash.learning_streak_days > 0 && (
          <p className="text-sm text-neutral-500 mt-1">
            You&apos;re on a {dash.learning_streak_days}-day learning streak. Keep it up!
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-[22px]"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.iconBg}`}
              >
                <s.icon className="w-4 h-4" />
              </div>
              {s.badge && <Badge variant="violet">{s.badge}</Badge>}
            </div>
            <div className="text-[1.5rem] font-extrabold text-neutral-900 tracking-tight">
              {s.value}
            </div>
            <div className="text-[.78rem] text-neutral-500 mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Continue Learning + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Continue Learning */}
        <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[.95rem] font-bold">Continue Learning</div>
            <Button variant="ghost-v" size="sm" href="/dashboard/student/courses">
              See all →
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {courses.length === 0 && (
              <p className="text-sm text-neutral-500 py-6 text-center">
                No courses in progress yet.
              </p>
            )}
            {courses.map((c, i) => (
              <div
                key={c.id}
                className="bg-neutral-50 border-[1.5px] border-neutral-200 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:border-violet-200 hover:shadow-xl hover:-translate-y-[3px] transition-all cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-[10px] bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-[1.4rem] shrink-0`}
                >
                  
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-1.5 truncate">
                    {c.course_title}
                  </div>
                  <ProgressBar value={c.progress_percentage} color={COLORS[i % COLORS.length]} />
                  <div className="text-[.72rem] text-neutral-500 mt-1">
                    Module {c.completed_modules} of {c.module_count} · {c.progress_percentage}% complete
                  </div>
                </div>
                <Button variant="primary" size="sm">
                  <Play className="w-3 h-3" />
                  Resume
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3.5">
          {/* Upcoming Live Classes */}
          <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-5">
            <div className="text-[.9rem] font-bold mb-3.5">
              Upcoming Live Classes
            </div>
            <div className="flex flex-col gap-3">
              {upcoming.length === 0 && (
                <p className="text-[.8rem] text-neutral-400">No upcoming classes.</p>
              )}
              {upcoming.map((cls) => {
                const d = new Date(cls.scheduled_date);
                const day = d.toLocaleDateString("en-US", { weekday: "short" });
                const date = d.getDate();
                return (
                  <div key={cls.id} className="flex items-start gap-3">
                    <div className="bg-violet-50 border-[1.5px] border-violet-100 rounded-lg px-2.5 py-1.5 text-center shrink-0 min-w-[44px]">
                      <div className="text-[.65rem] font-bold text-primary uppercase">
                        {day}
                      </div>
                      <div className="text-[1.1rem] font-extrabold text-primary leading-none">
                        {date}
                      </div>
                    </div>
                    <div>
                      <div className="text-[.82rem] font-semibold">{cls.class_title}</div>
                      <div className="text-[.73rem] text-neutral-500 mt-0.5">
                        {cls.tutor_name} · {cls.start_time?.slice(0, 5)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-5">
            <div className="text-[.9rem] font-bold mb-3.5">Recent Activity</div>
            <div className="flex flex-col gap-2.5">
              {activity.length === 0 && (
                <p className="text-[.8rem] text-neutral-400">No recent activity.</p>
              )}
              {activity.map((a) => {
                const { bg, color, Icon } = getNotifStyle(a.notification_type);
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg} ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[.8rem] font-semibold">{a.title}</div>
                      <div className="text-[.72rem] text-neutral-500">
                        {new Date(a.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
