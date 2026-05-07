"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  FileText,
  Star,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { apiFetch, tutorApi } from "@/lib/api";
import type {
  Course,
  LiveClass,
  PaginatedResponse,
  StudyGuide,
  TutorDiscovery,
} from "@/lib/types";

function formatMoney(value: string) {
  return `BWP ${Number(value || 0).toLocaleString("en-BW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TutorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tutorId = Number(id);

  const [tutor, setTutor] = useState<TutorDiscovery | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [tutorData, courseData, guideData, liveData] = await Promise.all([
          tutorApi.getDiscoveryDetail(tutorId),
          apiFetch<PaginatedResponse<Course>>(`/courses/?tutor=${tutorId}`),
          apiFetch<PaginatedResponse<StudyGuide>>(`/courses/study-guides/?tutor=${tutorId}`),
          apiFetch<PaginatedResponse<LiveClass>>(`/courses/live-classes/?tutor=${tutorId}`),
        ]);
        setTutor(tutorData);
        setCourses(courseData.results.slice(0, 4));
        setGuides(guideData.results.slice(0, 4));
        setLiveClasses(liveData.results.slice(0, 4));
      } catch {
        setTutor(null);
      } finally {
        setLoading(false);
      }
    }
    if (!Number.isNaN(tutorId)) {
      void load();
    }
  }, [tutorId]);

  if (loading) {
    return (
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-center py-20">
          <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
      </section>
    );
  }

  if (!tutor) {
    return (
      <section className="py-20">
        <div className="max-w-[900px] mx-auto px-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center">
            <p className="text-sm text-neutral-500">Tutor profile not found.</p>
            <div className="mt-4">
              <Button variant="secondary" size="md" href="/tutors">
                Back to tutors
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const initials =
    `${tutor.first_name?.[0] ?? tutor.tutor_name[0] ?? "T"}${tutor.last_name?.[0] ?? ""}`.toUpperCase();
  const plan = tutor.subscription_plan;

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <Link
          href="/tutors"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Tutors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border-[1.5px] border-neutral-200 bg-white">
              <div className="bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,.22),_transparent_35%),linear-gradient(135deg,#111827,#1f2937)] p-8 text-white">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-extrabold backdrop-blur-sm">
                      {initials}
                    </div>
                    <div>
                      <Badge variant="violet" className="mb-3">
                        {tutor.subject_area || "Tutor"}
                      </Badge>
                      <h1 className="text-[2.3rem] font-extrabold tracking-tight leading-tight">
                        {tutor.tutor_name}
                      </h1>
                      <p className="mt-2 max-w-[640px] text-sm leading-relaxed text-white/70">
                        {tutor.bio || tutor.statement || "Explore this tutor's subscription-powered library and join for unlimited access to paid courses, study guides, and live sessions."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                      <div className="text-lg font-extrabold">{tutor.active_subscribers}</div>
                      <div className="mt-1 text-[.72rem] uppercase tracking-[0.08em] text-white/60">Active subscribers</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                      <div className="text-lg font-extrabold">
                        {tutor.average_rating ? tutor.average_rating.toFixed(1) : "New"}
                      </div>
                      <div className="mt-1 text-[.72rem] uppercase tracking-[0.08em] text-white/60">Average rating</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6">
                <div className="rounded-2xl bg-violet-50 p-4">
                  <div className="text-lg font-extrabold text-neutral-900">{tutor.published_courses_count}</div>
                  <div className="mt-1 text-[.72rem] uppercase tracking-[0.08em] text-neutral-500">Courses</div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-lg font-extrabold text-neutral-900">{tutor.published_guides_count}</div>
                  <div className="mt-1 text-[.72rem] uppercase tracking-[0.08em] text-neutral-500">Study guides</div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <div className="text-lg font-extrabold text-neutral-900">{tutor.upcoming_live_classes_count}</div>
                  <div className="mt-1 text-[.72rem] uppercase tracking-[0.08em] text-neutral-500">Live sessions</div>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <div className="text-lg font-extrabold text-neutral-900">{tutor.review_count}</div>
                  <div className="mt-1 text-[.72rem] uppercase tracking-[0.08em] text-neutral-500">Reviews</div>
                </div>
              </div>
            </div>

            {tutor.qualifications ? (
              <div className="rounded-[24px] border border-neutral-200 bg-white p-6">
                <div className="text-[.72rem] font-bold uppercase tracking-[0.08em] text-neutral-500 mb-2">
                  Qualifications
                </div>
                <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
                  {tutor.qualifications}
                </p>
              </div>
            ) : null}

            {courses.length > 0 ? (
              <div className="rounded-[24px] border border-neutral-200 bg-white p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-neutral-900">Featured Courses</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      Courses included in this tutor&apos;s subscription library.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" href={`/courses?tutor=${tutor.id}`}>
                    View all
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-violet-300 hover:bg-violet-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-neutral-900">{course.title}</div>
                          <div className="mt-1 text-[.75rem] text-neutral-400">{course.category_name}</div>
                        </div>
                        <Badge variant={course.is_free ? "green" : "amber"}>
                          {course.is_free ? "Free" : "Subscriber"}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {guides.length > 0 ? (
              <div className="rounded-[24px] border border-neutral-200 bg-white p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-neutral-900">Study Guides</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      Printable resources and revision materials from this tutor.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" href={`/study-guides?tutor=${tutor.id}`}>
                    View all
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {guides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={`/study-guides?tutor=${tutor.id}&search=${encodeURIComponent(guide.title)}`}
                      className="rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-violet-300 hover:bg-violet-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-neutral-900">{guide.title}</div>
                          <div className="mt-1 text-[.75rem] text-neutral-400">
                            {guide.page_count} pages · {guide.category_name}
                          </div>
                        </div>
                        <FileText className="w-4 h-4 text-neutral-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            {liveClasses.length > 0 ? (
              <div className="rounded-[24px] border border-neutral-200 bg-white p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-neutral-900">Live Sessions</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      Scheduled sessions you can join after subscribing.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" href={`/live-sessions?tutor=${tutor.id}`}>
                    View all
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {liveClasses.map((liveClass) => (
                    <Link
                      key={liveClass.id}
                      href={`/live-sessions?tutor=${tutor.id}&search=${encodeURIComponent(liveClass.title)}`}
                      className="rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-violet-300 hover:bg-violet-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-neutral-900">{liveClass.title}</div>
                          <div className="mt-1 text-[.75rem] text-neutral-400">
                            {liveClass.scheduled_date} · {liveClass.category_name}
                          </div>
                        </div>
                        <CalendarClock className="w-4 h-4 text-neutral-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:sticky lg:top-[90px] self-start">
            <div className="rounded-[24px] border-[1.5px] border-neutral-200 bg-white p-6">
              <div className="text-[.72rem] font-bold uppercase tracking-[0.08em] text-neutral-500 mb-3">
                Subscription pricing
              </div>

              {plan ? (
                <div className="space-y-3">
                  {[
                    { label: "Weekly", value: plan.weekly_price, unit: "week" },
                    { label: "Monthly", value: plan.monthly_price, unit: "month" },
                    { label: "Yearly", value: plan.yearly_price, unit: "year" },
                  ]
                    .filter((item) => Number(item.value) > 0)
                    .map((item) => (
                      <div key={item.label} className="rounded-2xl border border-neutral-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-neutral-900">{item.label}</div>
                            <div className="mt-1 text-xs text-neutral-500">
                              Unlimited paid access for one {item.unit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-extrabold text-violet-700">
                              {formatMoney(item.value)}
                            </div>
                            <div className="text-xs text-neutral-500">/{item.unit}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  This tutor has not published subscription pricing yet.
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                  <Users className="w-4 h-4 text-violet-600" />
                  One subscription, full library access
                </div>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500">
                  Paid courses, study guides, and live sessions from this tutor are all covered by the same subscription.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setSubscribeOpen(true)}
                  disabled={!plan}
                >
                  Subscribe to {tutor.tutor_name}
                </Button>
                <Button variant="secondary" size="md" className="w-full" href={`/courses?tutor=${tutor.id}`}>
                  Browse this tutor&apos;s content
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-neutral-200 bg-white p-5">
              <div className="text-[.72rem] font-bold uppercase tracking-[0.08em] text-neutral-500 mb-3">
                Why learners subscribe
              </div>
              <div className="space-y-3 text-sm text-neutral-600">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 mt-0.5 text-violet-600" />
                  <span>Unlimited access to this tutor&apos;s paid courses and lesson materials.</span>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 text-emerald-600" />
                  <span>Study guides and revision sheets stay under the same tutor subscription.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-0.5 text-amber-500" />
                  <span>Live session registration is bundled into the same paid relationship.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        onSuccess={() => setSubscribeOpen(false)}
        tutorId={tutor.id}
        tutorName={tutor.tutor_name}
        title={`All paid content by ${tutor.tutor_name}`}
        plan={tutor.subscription_plan}
        returnTo={`/tutors/${tutor.id}`}
      />
    </section>
  );
}
