"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  BookOpen,
  Clock,
  PlayCircle,
  FileText,
  Video,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, parentApi, paymentApi, ApiError } from "@/lib/api";
import type {
  ChildSummary,
  CourseDetail,
  PaginatedResponse,
  Enrollment,
  ParentPreference,
  TutorSubscription,
} from "@/lib/types";

const contentIcon: Record<string, React.ElementType> = {
  video: Video,
  reading: FileText,
  quiz: BookOpen,
};

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, tokens } = useAuth();
  const toast = useToast();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorWorking, setSelectorWorking] = useState(false);
  const [subscriptions, setSubscriptions] = useState<TutorSubscription[]>([]);
  const [parentPreferences, setParentPreferences] = useState<ParentPreference | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<CourseDetail>(`/courses/${slug}/`);
        setCourse(data);
      } catch {
        toast.error("Course not found.");
        router.push("/courses");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, slug, toast]);

  useEffect(() => {
    if (!tokens?.access || !user || user.role !== "student") return;
    apiFetch<PaginatedResponse<Enrollment>>("/students/enrollments/", {
      token: tokens.access,
    })
      .then((data) => {
        const match = data.results.find((item) => item.course_slug === slug);
        if (match) setEnrollmentId(match.id);
      })
      .catch(() => {});
  }, [slug, tokens, user]);

  useEffect(() => {
    if (!tokens?.access || user?.role !== "parent") return;
    Promise.all([
      parentApi.getChildren(tokens.access),
      parentApi.getPreferences(tokens.access),
      paymentApi.getMySubscriptions(tokens.access),
    ])
      .then(([items, preferences, subscriptionData]) => {
        setChildren(items);
        setParentPreferences(preferences);
        setSubscriptions(Array.isArray(subscriptionData) ? subscriptionData : subscriptionData.results ?? []);
      })
      .catch(() => {
        setChildren([]);
        setParentPreferences(null);
      });
  }, [tokens, user?.role]);

  useEffect(() => {
    if (!tokens?.access || user?.role !== "student") return;
    paymentApi
      .getMySubscriptions(tokens.access)
      .then((subscriptionData) =>
        setSubscriptions(
          Array.isArray(subscriptionData) ? subscriptionData : subscriptionData.results ?? []
        )
      )
      .catch(() => setSubscriptions([]));
  }, [tokens, user?.role]);

  function hasTutorSubscriptionForChild(childId: number) {
    if (!course) return false;
    return subscriptions.some(
      (subscription) =>
        (subscription.student === childId || subscription.student == null) &&
        subscription.tutor === course.tutor &&
        subscription.is_currently_active
    );
  }

  function subscriptionForChild(childId: number) {
    if (!course) return null;
    return (
      subscriptions.find(
        (item) =>
          item.student === childId &&
          item.tutor === course.tutor &&
          item.is_currently_active
      ) ??
      subscriptions.find(
        (item) =>
          item.student == null &&
          item.tutor === course.tutor &&
          item.is_currently_active
      ) ??
      null
    );
  }

  function hasStudentSubscription() {
    if (!course) return false;
    return subscriptions.some(
      (subscription) =>
        subscription.tutor === course.tutor && subscription.is_currently_active
    );
  }

  function parentAccessHref(childId: number, subscription?: TutorSubscription | null) {
    const params = new URLSearchParams({
      tutor: String(course?.tutor ?? ""),
      child: String(childId),
      course: slug,
    });
    if (subscription?.reference) params.set("subscription", subscription.reference);
    return `/dashboard/parent/access?${params.toString()}`;
  }

  async function enrollParentChild(child: ChildSummary) {
    if (!tokens?.access || !course) return;
    await parentApi.enrollChildInCourse(tokens.access, child.child_id, course.slug);
    toast.success(`${child.first_name} was enrolled successfully!`);
  }

  async function handleEnroll() {
    if (!course) return;

    if (!user) {
      if (course.is_free) {
        router.push(`/auth/signin?role=child&next=/courses/${slug}`);
      } else {
        setSubscribeOpen(true);
      }
      return;
    }

    if (user.role === "parent") {
      if (children.length === 0) {
        if (course.is_free) {
          toast.error("Link a child first before enrolling them.");
          return;
        }
        setSelectedChild(null);
        setSubscribeOpen(true);
        return;
      }
      if (children.length === 1) {
        const child = children[0];
        setSelectedChild(child);
        if (course.is_free) {
          setEnrolling(true);
          try {
            await enrollParentChild(child);
          } catch (err) {
            const msg =
              err instanceof ApiError && typeof err.body?.detail === "string"
                ? err.body.detail
                : "Enrollment failed.";
            toast.error(msg);
          } finally {
            setEnrolling(false);
          }
          return;
        }
        if (hasTutorSubscriptionForChild(child.child_id)) {
          setEnrolling(true);
          try {
            await enrollParentChild(child);
            router.push(parentAccessHref(child.child_id));
          } catch (err) {
            const msg =
              err instanceof ApiError && typeof err.body?.detail === "string"
                ? err.body.detail
                : "Assignment failed.";
            toast.error(msg);
          } finally {
            setEnrolling(false);
          }
          return;
        }
        setSubscribeOpen(true);
        return;
      }
      setSelectedChild(children[0] ?? null);
      setSelectorOpen(true);
      return;
    }

    if (user.role !== "student") {
      toast.error("Only students or parents can unlock course access.");
      return;
    }

    setEnrolling(true);
    try {
      if (course.is_free || hasStudentSubscription()) {
        const enrollment = await apiFetch<Enrollment>("/students/enroll/", {
          token: tokens!.access,
          method: "POST",
          body: JSON.stringify({ course_slug: slug }),
        });
        setEnrollmentId(enrollment.id);
        toast.success(
          course.is_free ? "Enrolled successfully!" : "Course unlocked from your active tutor subscription."
        );
      } else {
        setSubscribeOpen(true);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const msg =
          typeof err.body?.detail === "string" ? err.body.detail : "Enrollment failed.";
        toast.error(msg);
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setEnrolling(false);
    }
  }

  async function confirmChildSelection() {
    if (!course || !selectedChild) return;
    const child = selectedChild;
    setSelectorWorking(true);
    setSelectorOpen(false);
    try {
      if (course.is_free) {
        setEnrolling(true);
        try {
          await enrollParentChild(child);
        } catch (err) {
          const msg =
            err instanceof ApiError && typeof err.body?.detail === "string"
              ? err.body.detail
              : "Enrollment failed.";
          toast.error(msg);
        } finally {
          setEnrolling(false);
        }
        return;
      }
      if (hasTutorSubscriptionForChild(child.child_id)) {
        const subscription = subscriptionForChild(child.child_id);
        setEnrolling(true);
        try {
          await enrollParentChild(child);
          router.push(parentAccessHref(child.child_id, subscription));
        } catch (err) {
          const msg =
            err instanceof ApiError && typeof err.body?.detail === "string"
              ? err.body.detail
              : "Assignment failed.";
          toast.error(msg);
        } finally {
          setEnrolling(false);
        }
        return;
      }
      setSubscribeOpen(true);
    } finally {
      setSelectorWorking(false);
    }
  }

  if (loading) {
    return (
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-center py-20">
          <svg
            className="animate-spin w-6 h-6 text-violet-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
      </section>
    );
  }

  if (!course) return null;

  const sortedModules = [...(course.modules || [])].sort((a, b) => a.order - b.order);
  const avgRating = course.average_rating ?? 0;
  const totalDuration = sortedModules.reduce(
    (sum, item) => sum + (item.duration_minutes || 0),
    0
  );
  const singleChild = children.length === 1 ? children[0] : null;
  const parentAlreadySubscribed =
    user?.role === "parent" &&
    !!singleChild &&
    hasTutorSubscriptionForChild(singleChild.child_id);
  const studentAlreadySubscribed = user?.role === "student" && hasStudentSubscription();
  const paidActionLabel =
    user?.role === "parent" && parentAlreadySubscribed
      ? "Assign to Child"
      : studentAlreadySubscribed
      ? "Unlock Course"
      : "Subscribe to Unlock";

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-neutral-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Courses
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          <div>
            {course.cover_image && (
              <div className="rounded-2xl overflow-hidden mb-6 border border-neutral-200">
                <img
                  src={course.cover_image}
                  alt={course.title}
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}

            <Badge variant="violet" className="mb-3">
              {course.category_name}
            </Badge>
            <h1 className="text-[2rem] font-extrabold tracking-tight leading-tight mb-2">
              {course.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-neutral-500 mb-5 flex-wrap">
              <Link href={`/tutors/${course.tutor}`} className="font-medium hover:text-violet-700">
                By {course.tutor_name}
              </Link>
              {avgRating > 0 && (
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {avgRating.toFixed(1)} ({course.review_count})
                </span>
              )}
              <span>{course.module_count} modules</span>
              {totalDuration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {totalDuration} min
                </span>
              )}
            </div>

            <div className="prose prose-sm max-w-none text-neutral-600 mb-10 whitespace-pre-line">
              {course.description}
            </div>

            <h2 className="text-lg font-extrabold mb-4">
              Course Content ({sortedModules.length} modules)
            </h2>
            <div className="flex flex-col gap-2 mb-10">
              {sortedModules.map((module, index) => {
                const Icon = contentIcon[module.content_type] || BookOpen;
                return (
                  <div
                    key={module.id}
                    className="flex items-center gap-3 bg-white border-[1.5px] border-neutral-200 rounded-xl px-4 py-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">
                        {index + 1}. {module.title}
                      </div>
                      {module.duration_minutes ? (
                        <div className="text-[.75rem] text-neutral-400">
                          {module.duration_minutes} min
                        </div>
                      ) : null}
                    </div>
                    {!enrollmentId && <Lock className="w-3.5 h-3.5 text-neutral-300" />}
                  </div>
                );
              })}
            </div>

            {course.reviews && course.reviews.length > 0 && (
              <>
                <h2 className="text-lg font-extrabold mb-4">
                  Reviews ({course.reviews.length})
                </h2>
                <div className="flex flex-col gap-3">
                  {course.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white border-[1.5px] border-neutral-200 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[.65rem] font-bold">
                          {review.student_name
                            .split(" ")
                            .map((name) => name[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="text-sm font-semibold">{review.student_name}</span>
                        <span className="flex items-center gap-0.5 text-[.78rem] text-amber-500 font-bold ml-auto">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {review.rating}
                        </span>
                      </div>
                      {review.comment ? (
                        <p className="text-sm text-neutral-600">{review.comment}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="lg:sticky lg:top-[90px] self-start">
            <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-6">
              <div className="text-3xl font-extrabold mb-1">
                {course.is_free ? "Free" : course.subscription_plan?.monthly_price ? `P${course.subscription_plan.monthly_price}` : "Subscription"}
              </div>
              <p className="text-sm text-neutral-400 mb-5">
                {course.is_free
                  ? "Instant access"
                  : "Monthly tutor subscription unlocks all paid content"}
              </p>

              {enrollmentId ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  href={`/dashboard/student/courses/${slug}`}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={enrolling}
                  onClick={() => void handleEnroll()}
                >
                  {course.is_free ? "Unlock Free Access" : paidActionLabel}
                </Button>
              )}

              <div className="border-t border-neutral-200 mt-5 pt-5 flex flex-col gap-3 text-sm text-neutral-600">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-neutral-400" />
                  {course.module_count} modules
                </div>
                {totalDuration > 0 ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    {totalDuration} minutes of content
                  </div>
                ) : null}
                {avgRating > 0 ? (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {avgRating.toFixed(1)} average rating
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectorOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-[20px] bg-white p-6 shadow-2xl">
            <h3 className="font-extrabold text-neutral-900">Choose a child</h3>
            <p className="mt-1 text-xs text-neutral-500">
              This subscription unlocks {course.title} and the rest of {course.tutor_name}&apos;s paid library.
            </p>
            <div className="mt-4 space-y-2">
              {children.map((child) => (
                <button
                  key={child.child_id}
                  type="button"
                  onClick={() => setSelectedChild(child)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedChild?.child_id === child.child_id
                      ? "border-violet-400 bg-violet-50"
                      : "border-neutral-200 hover:border-violet-300 hover:bg-violet-50"
                  }`}
                >
                  <div className="text-sm font-semibold text-neutral-900">
                    {child.first_name} {child.last_name}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">{child.email}</div>
                  <div className="mt-1 text-[.7rem] text-neutral-500">
                    {course.is_free
                      ? "Free course"
                      : hasTutorSubscriptionForChild(child.child_id)
                      ? "Subscription active"
                      : "Needs subscription"}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectorOpen(false);
                  setSelectedChild(null);
                }}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedChild || selectorWorking}
                onClick={() => void confirmChildSelection()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectorWorking
                  ? "Saving..."
                  : course.is_free
                  ? "Save & Enroll"
                  : selectedChild && hasTutorSubscriptionForChild(selectedChild.child_id)
                  ? "Save & Assign"
                  : "Continue to Subscribe"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!course.is_free ? (
        <PaymentModal
          open={subscribeOpen}
          onClose={() => {
            setSubscribeOpen(false);
            if (user?.role !== "parent") setSelectedChild(null);
          }}
          onSuccess={async (result) => {
            if (!tokens?.access) {
              setSubscribeOpen(false);
              return;
            }

            if (user?.role === "parent") {
              const childIdToEnroll = result.subscription?.student ?? selectedChild?.child_id;
              if (!childIdToEnroll) {
                toast.success("Subscription activated. Invite or link a child to start assigning content.");
                setSubscribeOpen(false);
                return;
              }
              const shouldAutoAssign =
                (parentPreferences?.auto_assign_single_child ?? true) &&
                children.length === 1;
              if (shouldAutoAssign) {
                try {
                  await parentApi.enrollChildInCourse(tokens.access, childIdToEnroll, slug);
                  toast.success("Subscription activated. The course was assigned automatically.");
                } catch {
                  toast.error("Subscription worked, but the course still needs to be assigned manually.");
                }
              } else {
                toast.success(
                  "Subscription activated. Next, assign courses, guides, or live sessions from the parent access screen."
                );
              }
              setSubscribeOpen(false);
              router.push(parentAccessHref(childIdToEnroll, result.subscription ?? null));
              return;
            }

            try {
              const enrollment = await apiFetch<Enrollment>("/students/enroll/", {
                token: tokens.access,
                method: "POST",
                body: JSON.stringify({ course_slug: slug }),
              });
              setEnrollmentId(enrollment.id);
              toast.success("Subscription activated and course unlocked!");
            } catch (err) {
              toast.error(
                err instanceof ApiError
                  ? String((err.body as Record<string, string>).detail ?? "Enrollment failed.")
                  : "Enrollment failed."
              );
            } finally {
              setSubscribeOpen(false);
            }
          }}
          tutorId={course.tutor}
          tutorName={course.tutor_name}
          title={course.title}
          plan={course.subscription_plan}
          childId={selectedChild?.child_id}
          childOptions={children}
          beneficiaryLabel={
            selectedChild
              ? `${selectedChild.first_name} ${selectedChild.last_name}`
              : undefined
          }
          returnTo={`/courses/${slug}`}
        />
      ) : null}
    </section>
  );
}
