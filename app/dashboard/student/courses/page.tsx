"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Play, Award, ShoppingCart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useToast } from "@/components/ui/toast";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, paymentApi } from "@/lib/api";
import type {
  Course,
  Enrollment,
  PaginatedResponse,
  TutorSubscription,
} from "@/lib/types";

type Tab = "my-courses" | "browse";

export default function StudentCoursesPage() {
  const { tokens, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("my-courses");

  // My enrollments
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(true);

  // Browse state
  const [courses, setCourses] = useState<Course[]>([]);
  const [browsing, setBrowsing] = useState(true);
  const [search, setSearch] = useState("");
  const [subscriptions, setSubscriptions] = useState<TutorSubscription[]>([]);

  // Per-item action loading
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [paymentTarget, setPaymentTarget] = useState<Course | null>(null);
  const canSelfSubscribe =
    !(user?.is_parent_managed_child && !user.can_self_subscribe);

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((e) => e.course)),
    [enrollments]
  );

  const fetchEnrollments = useCallback(async () => {
    if (!tokens) return;
    setEnrollLoading(true);
    try {
      const [data, subscriptionData] = await Promise.all([
        apiFetch<PaginatedResponse<Enrollment>>("/students/enrollments/", {
          token: tokens.access,
        }),
        paymentApi.getMySubscriptions(tokens.access),
      ]);
      setEnrollments(data.results);
      setSubscriptions(
        Array.isArray(subscriptionData) ? subscriptionData : subscriptionData.results ?? []
      );
    } catch {
      toast.error("Failed to load your courses.");
    } finally {
      setEnrollLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  const fetchBrowse = useCallback(async () => {
    setBrowsing(true);
    try {
      const data = await apiFetch<PaginatedResponse<Course>>("/courses/");
      setCourses(data.results);
    } catch {
      toast.error("Failed to load courses.");
    } finally {
      setBrowsing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEnrollments();
      void fetchBrowse();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchEnrollments, fetchBrowse]);

  async function handleEnrollFree(course: Course) {
    if (!tokens) return;
    setActionLoading((p) => ({ ...p, [course.id]: true }));
    try {
      await apiFetch("/students/enroll/", {
        method: "POST",
        token: tokens.access,
        body: JSON.stringify({ course_slug: course.slug }),
      });
      toast.success("Enrolled successfully!");
      await fetchEnrollments();
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? String((e.body as Record<string, string>).detail ?? "Enrollment failed.")
          : "Enrollment failed."
      );
    } finally {
      setActionLoading((p) => ({ ...p, [course.id]: false }));
    }
  }

  async function handleEnrollWithSubscription(course: Course) {
    if (!tokens) return;
    setActionLoading((p) => ({ ...p, [course.id]: true }));
    try {
      await apiFetch("/students/enroll/", {
        method: "POST",
        token: tokens.access,
        body: JSON.stringify({ course_slug: course.slug }),
      });
      toast.success("Course unlocked from your active tutor subscription.");
      await fetchEnrollments();
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? String((e.body as Record<string, string>).detail ?? "Enrollment failed.")
          : "Enrollment failed."
      );
    } finally {
      setActionLoading((p) => ({ ...p, [course.id]: false }));
    }
  }

  function handleBuyCourse(course: Course) {
    setPaymentTarget(course);
  }

  function hasTutorSubscription(tutorId: number) {
    return subscriptions.some(
      (subscription) =>
        subscription.tutor === tutorId && subscription.is_currently_active
    );
  }

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category_name.toLowerCase().includes(q) ||
        c.tutor_name.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const gradient = (i: number) =>
    ["from-violet-50 to-violet-100", "from-orange-50 to-orange-100", "from-green-50 to-emerald-100", "from-blue-50 to-blue-100"][i % 4];
  const emoji = (i: number) => ["M", "P", "S", "T"][i % 4];
  const colorCycle = (i: number): "violet" | "orange" | "green" =>
    (["violet", "orange", "green"] as const)[i % 3];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">Courses</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-neutral-200 mb-5">
        {([
          ["my-courses", `My Courses${enrollments.length ? ` (${enrollments.length})` : ""}`],
          ["browse", "Browse Courses"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-[.85rem] font-semibold border-b-2 transition-colors -mb-px ${
              tab === id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* My Courses Tab */}
      {tab === "my-courses" && (
        enrollLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <p className="text-sm text-neutral-400 mb-3">You haven&apos;t enrolled in any courses yet.</p>
            <Button variant="primary" size="sm" onClick={() => setTab("browse")}>
              <Plus className="w-3.5 h-3.5" />
              Browse Courses
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {enrollments.map((e, i) => {
              const isComplete = e.completed_at !== null;
              const neverStarted = e.progress_percentage === 0 && !isComplete;
              const btnLabel = isComplete ? "Rewatch" : neverStarted ? "Start" : "Resume";
              return (
                <div
                  key={e.id}
                  className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden hover:border-violet-200 hover:shadow-2xl hover:-translate-y-[5px] transition-all"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {e.cover_image ? (
                      <Image src={e.cover_image} alt={e.course_title} fill className="object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradient(i)} flex items-center justify-center text-[3rem]`}>
                        {emoji(i)}
                      </div>
                    )}
                    <span className={`absolute top-3 right-3 ${isComplete ? "bg-green-600" : "bg-violet-600"} text-white text-[.72rem] font-bold px-2.5 py-1 rounded-full`}>
                      {isComplete ? "✓ Complete" : "In Progress"}
                    </span>
                  </div>
                  <div className="px-[18px] pt-4 pb-5">
                    <div className="text-[.975rem] font-bold leading-[1.4] mb-2">{e.course_title}</div>
                    <ProgressBar value={e.progress_percentage} color={isComplete ? "green" : colorCycle(i)} className="mb-1.5" />
                    <div className="text-xs text-neutral-500 mb-3">
                      {e.progress_percentage}% · {e.completed_modules} of {e.module_count} modules
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[.65rem] font-bold">
                        {e.tutor_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-[.8rem] font-medium text-neutral-700">{e.tutor_name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={isComplete ? "secondary" : "primary"}
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/student/courses/${e.course_slug}`)}
                      >
                        {!isComplete && <Play className="w-3 h-3" />}
                        {btnLabel}
                      </Button>
                      {isComplete && (
                        <Button variant="success-ghost" size="sm">
                          <Award className="w-[13px] h-[13px]" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Browse Tab */}
      {tab === "browse" && (
        <>
          <div className="mb-5">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search courses by title, tutor, or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white text-neutral-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 placeholder:text-neutral-400"
              />
            </div>
          </div>

          {browsing ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
              <p className="text-sm text-neutral-400">
                {search ? "No courses match your search." : "No courses available yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {filteredCourses.map((c, i) => {
                const isEnrolled = enrolledCourseIds.has(c.id);
                const isLoading = !!actionLoading[c.id];
                const tutorName = c.tutor_name || "Tutor";
                return (
                  <div
                    key={c.id}
                    className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden hover:border-violet-200 hover:shadow-2xl hover:-translate-y-[5px] transition-all cursor-pointer"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      {c.cover_image ? (
                        <Image src={c.cover_image} alt={c.title} fill className="object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${gradient(i)} flex items-center justify-center text-[3rem]`}>
                          {emoji(i)}
                        </div>
                      )}
                      <Badge variant={c.is_free ? "green" : "amber"} className="absolute top-3 right-3">
                        {c.is_free ? "Free" : "Subscription"}
                      </Badge>
                    </div>
                    <div className="px-[18px] pt-4 pb-5">
                      <div className="text-[.975rem] font-bold leading-[1.4] mb-1">{c.title}</div>
                      <div className="text-[.75rem] text-neutral-400 mb-3">
                        {c.category_name} · {c.module_count} modules
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[.65rem] font-bold">
                          {tutorName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="text-[.8rem] font-medium text-neutral-700">{tutorName}</span>
                      </div>
                      <div className="flex gap-2">
                        {isEnrolled ? (
                          <Button variant="outline-v" size="sm" className="flex-1" onClick={() => setTab("my-courses")}>
                            Already Enrolled
                          </Button>
                        ) : c.is_free || hasTutorSubscription(c.tutor) ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            loading={isLoading}
                            onClick={() =>
                              c.is_free ? handleEnrollFree(c) : handleEnrollWithSubscription(c)
                            }
                          >
                            {c.is_free ? "Enroll Free" : "Unlock with Subscription"}
                          </Button>
                        ) : canSelfSubscribe ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleBuyCourse(c)}
                          >
                            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                            Subscribe to Unlock
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            disabled
                          >
                            Managed by Parent
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {paymentTarget && (
        <PaymentModal
          open={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => {
            if (!tokens || !paymentTarget) return;
            apiFetch("/students/enroll/", {
              method: "POST",
              token: tokens.access,
              body: JSON.stringify({ course_slug: paymentTarget.slug }),
            })
              .then(() => {
                toast.success("Subscription activated and course unlocked!");
                setPaymentTarget(null);
                fetchEnrollments();
              })
              .catch((e) => {
                toast.error(
                  e instanceof ApiError
                    ? String((e.body as Record<string, string>).detail ?? "Enrollment failed.")
                    : "Enrollment failed."
                );
              });
          }}
          tutorId={paymentTarget.tutor}
          tutorName={paymentTarget.tutor_name}
          title={paymentTarget.title}
          plan={paymentTarget.subscription_plan}
        />
      )}
    </div>
  );
}
