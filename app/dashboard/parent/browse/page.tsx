"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Loader2,
  Search,
  BookOpen,
  Star,
  ShoppingCart,
  ChevronDown,
  X,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { parentApi, paymentApi, ApiError } from "@/lib/api";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import type {
  Course,
  ChildSummary,
  PaginatedResponse,
  ParentPreference,
  TutorSubscription,
} from "@/lib/types";

const GRADIENTS = [
  "from-violet-50 to-violet-100",
  "from-orange-50 to-orange-100",
  "from-green-50 to-emerald-100",
  "from-amber-50 to-amber-100",
];
const EMOJIS = ["M", "P", "S", "T"];

export default function ParentBrowsePage() {
  const router = useRouter();
  const { tokens } = useAuth();
  const toast = useToast();
  const accessToken = tokens?.access;

  const [courses, setCourses] = useState<Course[]>([]);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [preferences, setPreferences] = useState<ParentPreference | null>(null);
  const [subscriptions, setSubscriptions] = useState<TutorSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Child selector modal state
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null);
  const [selectorWorking, setSelectorWorking] = useState(false);

  // Payment modal state
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function load(token: string) {
      setLoading(true);
      try {
        const [coursesData, childrenData] = await Promise.all([
          apiFetch<PaginatedResponse<Course>>("/courses/"),
          parentApi.getChildren(token),
        ]);
        const [preferenceData, subscriptionData] = await Promise.all([
          parentApi.getPreferences(token),
          paymentApi.getMySubscriptions(token),
        ]);
        if (cancelled) return;
        setCourses(coursesData.results ?? []);
        setChildren(childrenData);
        setPreferences(preferenceData);
        setSubscriptions(
          Array.isArray(subscriptionData) ? subscriptionData : subscriptionData.results ?? []
        );
      } catch {
        if (!cancelled) toast.error("Failed to load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load(accessToken);
    return () => {
      cancelled = true;
    };
  }, [accessToken, toast]);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tutor_name.toLowerCase().includes(search.toLowerCase()) ||
      c.category_name.toLowerCase().includes(search.toLowerCase())
  );

  function hasTutorSubscription(course: Course, childId: number) {
    return subscriptions.some(
      (subscription) =>
        (subscription.student === childId || subscription.student == null) &&
        subscription.tutor === course.tutor &&
        subscription.is_currently_active
    );
  }

  function matchingSubscription(course: Course, childId: number) {
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

  function accessHref(course: Course, childId: number, subscription?: TutorSubscription | null) {
    const params = new URLSearchParams({
      tutor: String(course.tutor),
      child: String(childId),
      course: course.slug,
    });
    if (subscription?.reference) params.set("subscription", subscription.reference);
    return `/dashboard/parent/access?${params.toString()}`;
  }

  async function enrollChild(course: Course, child: ChildSummary) {
    if (!tokens) return;
    try {
      await parentApi.enrollChildInCourse(tokens.access, child.child_id, course.slug);
      toast.success(`${child.first_name} was enrolled in ${course.title}.`);
      setSelectedChild(null);
      setSelectedCourse(null);
      setSelectorOpen(false);
    } catch (err) {
      const msg =
        err instanceof ApiError && typeof err.body?.detail === "string"
          ? err.body.detail
          : "Failed to enroll child in this course.";
      toast.error(msg);
    }
  }

  function openEnroll(course: Course) {
    setSelectedCourse(course);
    if (children.length === 0) {
      if (course.is_free) {
        toast.error("Invite or link a child first to enroll them.");
        return;
      }
      setSelectedChild(null);
      setPayOpen(true);
      return;
    }
    if (children.length === 1) {
      const child = children[0];
      setSelectedChild(child);
      if (course.is_free) {
        void enrollChild(course, child);
        return;
      }
      if (hasTutorSubscription(course, child.child_id)) {
        void (async () => {
          await enrollChild(course, child);
          router.push(accessHref(course, child.child_id));
        })();
        return;
      }
      setPayOpen(true);
    } else {
      setSelectedChild(children[0] ?? null);
      setSelectorOpen(true);
    }
  }

  async function confirmChildSelection() {
    if (!selectedCourse || !selectedChild) return;
    setSelectorWorking(true);
    try {
      if (selectedCourse.is_free) {
        await enrollChild(selectedCourse, selectedChild);
        return;
      }
      if (hasTutorSubscription(selectedCourse, selectedChild.child_id)) {
        const subscription = matchingSubscription(
          selectedCourse,
          selectedChild.child_id
        );
        await enrollChild(selectedCourse, selectedChild);
        router.push(
          accessHref(selectedCourse, selectedChild.child_id, subscription)
        );
        return;
      }
      setSelectorOpen(false);
      setPayOpen(true);
    } finally {
      setSelectorWorking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Browse &amp; Enroll
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Subscribe children to tutors and enroll them into the right courses.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          placeholder="Search courses, tutors, or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border-[1.5px] border-neutral-200 rounded-[12px] text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/60"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">
            {search ? "No courses matched your search." : "No courses available."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course, idx) => (
            <div
              key={course.id}
              className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden hover:border-orange-200 hover:shadow-xl hover:-translate-y-[4px] transition-all"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                {course.cover_image ? (
                  <Image
                    src={course.cover_image}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${
                      GRADIENTS[idx % GRADIENTS.length]
                    } flex items-center justify-center text-3xl`}
                  >
                    {EMOJIS[idx % EMOJIS.length]}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[.7rem] bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                    {course.category_name}
                  </span>
                  {course.is_free && (
                    <span className="text-[.7rem] bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full">
                      Free
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-neutral-900 text-sm leading-snug mb-1 line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-xs text-neutral-500 mb-2">
                  by {course.tutor_name}
                </p>

                {course.average_rating != null && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-neutral-700">
                      {course.average_rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({course.review_count})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <span className="text-base font-bold text-neutral-900">
                    {course.is_free
                      ? "Free"
                      : course.subscription_plan &&
                        Number(course.subscription_plan.monthly_price) > 0
                      ? `From BWP ${parseFloat(
                          course.subscription_plan.monthly_price
                        ).toLocaleString("en-BW", {
                          minimumFractionDigits: 2,
                        })}/mo`
                      : "Subscription"}
                  </span>
                  <button
                    onClick={() => openEnroll(course)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[10px] text-xs font-semibold transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {course.is_free
                      ? "Enroll"
                      : children.length === 1 && hasTutorSubscription(course, children[0].child_id)
                      ? "Assign"
                      : "Subscribe"}
                  </button>
                </div>

                {children.length === 0 && (
                  <p className="text-[.7rem] text-neutral-400 mt-1.5">
                    Paid tutor access can be subscribed now and assigned to a child later.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Child selector modal */}
      {selectorOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectorOpen(false)}
          />
          <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-neutral-900">
                  Select a Child
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                  Enrolling in: {selectedCourse.title}
                </p>
              </div>
              <button
                onClick={() => setSelectorOpen(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {children.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-7 h-7 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No linked children.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <button
                    key={child.child_id}
                    onClick={() => setSelectedChild(child)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selectedChild?.child_id === child.child_id
                        ? "border-orange-400 bg-orange-50"
                        : "border-neutral-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {child.first_name[0]}
                      {child.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-neutral-900 truncate">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {child.email}
                      </p>
                      <p className="mt-1 text-[.7rem] text-neutral-500">
                        {selectedCourse?.is_free
                          ? "Free course"
                          : selectedCourse && hasTutorSubscription(selectedCourse, child.child_id)
                          ? "Subscription active"
                          : "Needs subscription"}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-300 ml-auto rotate-[-90deg] flex-shrink-0" />
                  </button>
                ))}

                <div className="pt-3 flex justify-end gap-2">
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
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selectorWorking
                      ? "Saving..."
                      : selectedCourse?.is_free
                      ? "Save & Enroll"
                      : selectedChild && selectedCourse && hasTutorSubscription(selectedCourse, selectedChild.child_id)
                      ? "Save & Assign"
                      : "Continue to Subscribe"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment modal */}
      {selectedCourse && selectedChild && (
        <PaymentModal
          open={payOpen}
          onClose={() => {
            setPayOpen(false);
            setSelectedChild(null);
            setSelectedCourse(null);
          }}
          onSuccess={(result) => {
            void (async () => {
              if (!tokens) return;
              const shouldAutoAssign =
                (preferences?.auto_assign_single_child ?? true) &&
                children.length === 1;
              if (shouldAutoAssign) {
                try {
                  await parentApi.enrollChildInCourse(
                    tokens.access,
                    selectedChild.child_id,
                    selectedCourse.slug
                  );
                  toast.success(
                    `${selectedChild.first_name} now has the tutor subscription and ${selectedCourse.title} was assigned automatically.`
                  );
                } catch {
                  toast.error("Subscription worked, but this course still needs to be assigned manually.");
                }
              } else {
                toast.success(
                  "Subscription activated. Now choose which materials this child should start with."
                );
              }
              setPayOpen(false);
              setSelectedChild(null);
              setSelectedCourse(null);
              router.push(
                accessHref(selectedCourse, selectedChild.child_id, result.subscription ?? null)
              );
            })();
          }}
          tutorId={selectedCourse.tutor}
          tutorName={selectedCourse.tutor_name}
          title={selectedCourse.title}
          plan={selectedCourse.subscription_plan}
          childId={selectedChild.child_id}
          beneficiaryLabel={`${selectedChild.first_name} ${selectedChild.last_name}`}
        />
      )}

      {selectedCourse && !selectedChild && (
        <PaymentModal
          open={payOpen}
          onClose={() => {
            setPayOpen(false);
            setSelectedCourse(null);
          }}
          onSuccess={() => {
            toast.success("Subscription activated. Invite or link a child to start assigning content.");
            setPayOpen(false);
            setSelectedCourse(null);
          }}
          tutorId={selectedCourse.tutor}
          tutorName={selectedCourse.tutor_name}
          title={selectedCourse.title}
          plan={selectedCourse.subscription_plan}
        />
      )}
    </div>
  );
}
