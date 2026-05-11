"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, Search, SlidersHorizontal, Star, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { useToast } from "@/components/ui/toast";
import { parentApi, tutorApi, paymentApi, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ChildSummary, PaginatedResponse, TutorDiscovery, TutorSubscription } from "@/lib/types";

type DiscoveryMode = "student" | "parent";

function formatMoney(value: string) {
  return `BWP ${Number(value || 0).toLocaleString("en-BW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStartingPrice(tutor: TutorDiscovery) {
  const plan = tutor.subscription_plan;
  if (!plan) return null;
  if (Number(plan.weekly_price) > 0) return { label: "weekly", value: plan.weekly_price };
  if (Number(plan.monthly_price) > 0) return { label: "monthly", value: plan.monthly_price };
  if (Number(plan.yearly_price) > 0) return { label: "yearly", value: plan.yearly_price };
  return null;
}

export function TutorDiscoveryDashboard({
  mode,
}: {
  mode: DiscoveryMode;
}) {
  const router = useRouter();
  const { tokens, user } = useAuth();
  const toast = useToast();

  const [tutors, setTutors] = useState<TutorDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pricingOnly, setPricingOnly] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<TutorDiscovery | null>(null);

  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [subscriptions, setSubscriptions] = useState<TutorSubscription[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<TutorDiscovery | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorWorking, setSelectorWorking] = useState(false);
  const canUseStudentSubscriptions =
    mode !== "student" || !(user?.is_parent_managed_child && !user.can_self_subscribe);

  useEffect(() => {
    let cancelled = false;

    async function loadTutors() {
      setLoading(true);
      try {
        const data = await tutorApi.getDiscoveryList({
          search: search || undefined,
          has_pricing: pricingOnly ? "true" : undefined,
        });
        if (cancelled) return;
        setTutors(data.results);
        setNext(data.next);
      } catch {
        if (!cancelled) toast.error("Failed to load tutors.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTutors();
    return () => {
      cancelled = true;
    };
  }, [pricingOnly, search, toast]);

  useEffect(() => {
    if (!tokens?.access) return;
    if (mode === "parent") {
      Promise.all([parentApi.getChildren(tokens.access), paymentApi.getMySubscriptions(tokens.access)])
        .then(([items, subscriptionData]) => {
          setChildren(items);
          setSubscriptions(
            Array.isArray(subscriptionData) ? subscriptionData : subscriptionData.results ?? []
          );
        })
        .catch(() => setChildren([]));
      return;
    }

    paymentApi
      .getMySubscriptions(tokens.access)
      .then((subscriptionData) =>
        setSubscriptions(
          Array.isArray(subscriptionData) ? subscriptionData : subscriptionData.results ?? []
        )
      )
      .catch(() => setSubscriptions([]));
  }, [mode, tokens?.access]);

  function activeSubscriptionFor(tutorId: number, childId: number) {
    return (
      subscriptions.find(
        (subscription) =>
          subscription.tutor === tutorId &&
          subscription.student === childId &&
          subscription.is_currently_active
      ) ??
      subscriptions.find(
        (subscription) =>
          subscription.tutor === tutorId &&
          subscription.student == null &&
          subscription.is_currently_active
      ) ??
      null
    );
  }

  function parentUnassignedSubscriptionFor(tutorId: number) {
    if (mode !== "parent") return null;
    return (
      subscriptions.find(
        (subscription) =>
          subscription.tutor === tutorId &&
          subscription.student == null &&
          subscription.is_currently_active
      ) ?? null
    );
  }

  function accessHref(tutorId: number, childId: number, reference?: string | null) {
    const params = new URLSearchParams({
      tutor: String(tutorId),
      child: String(childId),
    });
    if (reference) params.set("subscription", reference);
    return `/dashboard/parent/access?${params.toString()}`;
  }

  function studentSubscriptionFor(tutorId: number) {
    if (mode !== "student" || !user) return null;
    return (
      subscriptions.find(
        (subscription) =>
          subscription.tutor === tutorId &&
          subscription.student === user.id &&
          subscription.is_currently_active
      ) ?? null
    );
  }

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const url = new URL(next);
      const path = url.pathname + url.search;
      const endpoint = path.replace(/^\/apis/, "");
      const data = await apiFetch<PaginatedResponse<TutorDiscovery>>(endpoint);
      setTutors((prev) => [...prev, ...data.results]);
      setNext(data.next);
    } catch {
      toast.error("Failed to load more tutors.");
    } finally {
      setLoadingMore(false);
    }
  }

  function resetCheckoutState() {
    setPaymentTarget(null);
    setSelectedTutor(null);
    setSelectorOpen(false);
    if (mode === "student") {
      setSelectedChild(null);
    }
  }

  function handleSubscribe(tutor: TutorDiscovery) {
    if (mode === "student") {
      if (!canUseStudentSubscriptions) {
        toast.error("Tutor subscriptions are managed by your parent or guardian.");
        return;
      }
      if (studentSubscriptionFor(tutor.id)) {
        return;
      }
      setPaymentTarget(tutor);
      return;
    }

    setSelectedTutor(tutor);
    if (children.length === 1) {
      const child = children[0];
      const existingSubscription = activeSubscriptionFor(tutor.id, child.child_id);
      if (existingSubscription) {
        router.push(accessHref(tutor.id, child.child_id, existingSubscription.reference));
        return;
      }
      setSelectedChild(child);
      setPaymentTarget(tutor);
      return;
    }

    if (children.length === 0) {
      setSelectedChild(null);
      setPaymentTarget(tutor);
      return;
    }

    setSelectedChild(children[0] ?? null);
    setSelectorOpen(true);
  }

  function confirmChildSelection() {
    if (!selectedTutor || !selectedChild) return;
    setSelectorWorking(true);
    const existingSubscription = activeSubscriptionFor(
      selectedTutor.id,
      selectedChild.child_id
    );
    if (existingSubscription) {
      setSelectorOpen(false);
      setSelectorWorking(false);
      router.push(
        accessHref(selectedTutor.id, selectedChild.child_id, existingSubscription.reference)
      );
      return;
    }
    setSelectorOpen(false);
    setSelectorWorking(false);
    setPaymentTarget(selectedTutor);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Discover Tutors
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {mode === "parent"
            ? "Pick a tutor and start a subscription that unlocks that tutor's full paid library for a child now or later."
            : "Search tutors by subject and subscribe from your own student account when you're ready."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-[420px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            className="w-full pl-10 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[12px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
            placeholder="Search tutors, subjects, or expertise..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
          <input
            type="checkbox"
            checked={pricingOnly}
            onChange={(e) => setPricingOnly(e.target.checked)}
            className="w-4 h-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
          />
          Has subscription pricing
        </label>
        <div className="ml-auto flex items-center gap-2 text-sm text-neutral-500">
          <SlidersHorizontal className="w-4 h-4" />
          <span>{tutors.length} tutors</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : tutors.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <p className="text-sm text-neutral-400">
            {search ? "No tutors matched your search." : "No tutors available yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tutors.map((tutor, index) => {
              const accent = [
                "from-violet-500 to-fuchsia-500",
                "from-amber-400 to-orange-500",
                "from-emerald-400 to-teal-500",
                "from-blue-400 to-cyan-500",
              ][index % 4];
              const startingPrice = getStartingPrice(tutor);
              const initials =
                `${tutor.first_name?.[0] ?? tutor.tutor_name[0] ?? "T"}${tutor.last_name?.[0] ?? ""}`.toUpperCase();

              return (
                <div
                  key={tutor.id}
                  className="overflow-hidden rounded-[22px] border-[1.5px] border-neutral-200 bg-white transition-all hover:-translate-y-[4px] hover:border-violet-200 hover:shadow-xl"
                >
                  <div className={`h-[132px] bg-gradient-to-br ${accent} p-5`}>
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/35 bg-white/15 text-base font-extrabold text-white backdrop-blur-sm">
                        {initials}
                      </div>
                      <Badge variant={startingPrice ? "violet" : "neutral"}>
                        {startingPrice
                          ? `From ${formatMoney(startingPrice.value)}/${startingPrice.label === "yearly" ? "yr" : startingPrice.label === "monthly" ? "mo" : "wk"}`
                          : "Pricing soon"}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <Link
                          href={`/tutors/${tutor.id}`}
                          className="text-[1rem] font-bold text-neutral-900 hover:text-violet-700"
                        >
                          {tutor.tutor_name}
                        </Link>
                        <div className="mt-1 text-[.75rem] uppercase tracking-[0.08em] text-neutral-400">
                          {tutor.subject_area || "Tutor"}
                        </div>
                      </div>
                      {tutor.average_rating ? (
                        <div className="flex items-center gap-1 text-[.78rem] font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          {tutor.average_rating.toFixed(1)}
                        </div>
                      ) : null}
                    </div>

                    <p className="line-clamp-3 text-[.85rem] leading-relaxed text-neutral-500 mb-4">
                      {tutor.bio || tutor.statement || "Explore this tutor's growing library of courses, guides, and live sessions."}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="rounded-2xl bg-violet-50 px-3 py-3">
                        <div className="text-sm font-extrabold text-neutral-900">{tutor.published_courses_count}</div>
                        <div className="mt-1 text-[.68rem] uppercase tracking-[0.08em] text-neutral-500">Courses</div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                        <div className="text-sm font-extrabold text-neutral-900">{tutor.published_guides_count}</div>
                        <div className="mt-1 text-[.68rem] uppercase tracking-[0.08em] text-neutral-500">Guides</div>
                      </div>
                      <div className="rounded-2xl bg-amber-50 px-3 py-3">
                        <div className="text-sm font-extrabold text-neutral-900">{tutor.upcoming_live_classes_count}</div>
                        <div className="mt-1 text-[.68rem] uppercase tracking-[0.08em] text-neutral-500">Live</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[.78rem] text-neutral-500 mb-5">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        {tutor.active_subscribers} active
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                        {tutor.review_count} reviews
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-neutral-400" />
                        Full library
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" href={`/tutors/${tutor.id}`}>
                        View profile
                      </Button>
                      {mode === "student" && studentSubscriptionFor(tutor.id) ? (
                        <Button variant="secondary" size="sm" className="flex-1" disabled>
                          Subscribed
                        </Button>
                      ) : mode === "parent" && children.length === 0 && parentUnassignedSubscriptionFor(tutor.id) ? (
                        <Button variant="secondary" size="sm" className="flex-1" disabled>
                          Subscribed
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          disabled={
                            !startingPrice ||
                            (mode === "student" && !canUseStudentSubscriptions)
                          }
                          onClick={() => handleSubscribe(tutor)}
                        >
                          {mode === "parent" && children.length > 1
                            ? "Choose Child"
                            : mode === "parent" &&
                              children.length === 1 &&
                              activeSubscriptionFor(tutor.id, children[0].child_id)
                            ? "Manage Access"
                            : mode === "parent" && children.length === 0
                            ? "Subscribe"
                            : !canUseStudentSubscriptions
                            ? "Managed by Parent"
                            : "Subscribe"}
                        </Button>
                      )}
                    </div>

                    {mode === "parent" && children.length === 0 ? (
                      <p className="mt-2 text-[.72rem] text-neutral-400">
                        You can subscribe now and assign this tutor to a child once one is linked.
                      </p>
                    ) : mode === "student" && !canUseStudentSubscriptions ? (
                      <p className="mt-2 text-[.72rem] text-neutral-400">
                        A linked parent or guardian manages tutor subscriptions for this learner account.
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {next ? (
            <div className="text-center">
              <Button variant="secondary" size="md" loading={loadingMore} onClick={loadMore}>
                Load more tutors
              </Button>
            </div>
          ) : null}
        </>
      )}

      {selectorOpen && selectedTutor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectorOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-[20px] bg-white p-6 shadow-2xl">
            <h3 className="font-extrabold text-neutral-900">Choose a child</h3>
            <p className="mt-1 text-xs text-neutral-500">
              This subscription will unlock all paid content from {selectedTutor.tutor_name}.
            </p>
            <div className="mt-4 space-y-2">
              {children.map((child) => (
                <button
                  key={child.child_id}
                  type="button"
                  onClick={() => setSelectedChild(child)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedChild?.child_id === child.child_id
                      ? "border-orange-400 bg-orange-50"
                      : "border-neutral-200 hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  <div className="text-sm font-semibold text-neutral-900">
                    {child.first_name} {child.last_name}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">{child.email}</div>
                  <div className="mt-1 text-[.7rem] text-neutral-500">
                    {selectedTutor && activeSubscriptionFor(selectedTutor.id, child.child_id)
                      ? "Subscription active"
                      : "New subscription"}
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
                onClick={confirmChildSelection}
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectorWorking
                  ? "Saving..."
                  : selectedChild &&
                    selectedTutor &&
                    activeSubscriptionFor(selectedTutor.id, selectedChild.child_id)
                  ? "Open Access"
                  : "Continue"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {paymentTarget ? (
        <PaymentModal
          open={!!paymentTarget}
          onClose={resetCheckoutState}
          onSuccess={(result) => {
            if (mode === "parent" && selectedChild) {
              toast.success(
                `${selectedChild.first_name} now has a subscription to ${paymentTarget.tutor_name}.`
              );
              router.push(
                accessHref(
                  paymentTarget.id,
                  selectedChild.child_id,
                  result.subscription?.reference ?? null
                )
              );
            } else if (mode === "parent") {
              toast.success(
                `Subscription activated for ${paymentTarget.tutor_name}. Assign it to a child when you're ready.`
              );
            } else {
              toast.success(`Subscription activated for ${paymentTarget.tutor_name}.`);
            }
            resetCheckoutState();
          }}
          tutorId={paymentTarget.id}
          tutorName={paymentTarget.tutor_name}
          title={`All paid content by ${paymentTarget.tutor_name}`}
          plan={paymentTarget.subscription_plan}
          childId={mode === "parent" ? selectedChild?.child_id : undefined}
          childOptions={mode === "parent" ? children : undefined}
          beneficiaryLabel={
            mode === "parent" && selectedChild
              ? `${selectedChild.first_name} ${selectedChild.last_name}`
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
