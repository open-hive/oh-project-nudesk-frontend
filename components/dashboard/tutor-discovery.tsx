"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2, Search, SlidersHorizontal, Star, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { useToast } from "@/components/ui/toast";
import { parentApi, tutorApi, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ChildSummary, PaginatedResponse, TutorDiscovery } from "@/lib/types";

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
  const { tokens } = useAuth();
  const toast = useToast();

  const [tutors, setTutors] = useState<TutorDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pricingOnly, setPricingOnly] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<TutorDiscovery | null>(null);

  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<TutorDiscovery | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const loadTutors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tutorApi.getDiscoveryList({
        search: search || undefined,
        has_pricing: pricingOnly ? "true" : undefined,
      });
      setTutors(data.results);
      setNext(data.next);
    } catch {
      toast.error("Failed to load tutors.");
    } finally {
      setLoading(false);
    }
  }, [pricingOnly, search, toast]);

  useEffect(() => {
    void loadTutors();
  }, [loadTutors]);

  useEffect(() => {
    if (mode !== "parent" || !tokens?.access) return;
    parentApi
      .getChildren(tokens.access)
      .then((items) => setChildren(items))
      .catch(() => setChildren([]));
  }, [mode, tokens?.access]);

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
      setPaymentTarget(tutor);
      return;
    }

    if (children.length === 0) {
      toast.error("Link a child first before subscribing them to a tutor.");
      return;
    }

    setSelectedTutor(tutor);
    if (children.length === 1) {
      const child = children[0];
      setSelectedChild(child);
      setPaymentTarget(tutor);
      return;
    }

    setSelectorOpen(true);
  }

  function handleChildSelect(child: ChildSummary) {
    if (!selectedTutor) return;
    setSelectedChild(child);
    setSelectorOpen(false);
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
            ? "Pick a tutor, choose a child, and start a subscription that unlocks that tutor's full paid library."
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
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        disabled={!startingPrice || (mode === "parent" && children.length === 0)}
                        onClick={() => handleSubscribe(tutor)}
                      >
                        Subscribe
                      </Button>
                    </div>

                    {mode === "parent" && children.length === 0 ? (
                      <p className="mt-2 text-[.72rem] text-neutral-400">
                        Link a child first to subscribe them to a tutor.
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
                  onClick={() => handleChildSelect(child)}
                  className="w-full rounded-xl border border-neutral-200 p-3 text-left transition-colors hover:border-orange-300 hover:bg-orange-50"
                >
                  <div className="text-sm font-semibold text-neutral-900">
                    {child.first_name} {child.last_name}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">{child.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {paymentTarget ? (
        <PaymentModal
          open={!!paymentTarget}
          onClose={resetCheckoutState}
          onSuccess={() => {
            if (mode === "parent" && selectedChild) {
              toast.success(
                `${selectedChild.first_name} now has a subscription to ${paymentTarget.tutor_name}.`
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
