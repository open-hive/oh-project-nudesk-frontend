"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Star, Users, BookOpen, Video, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { apiFetch, tutorApi } from "@/lib/api";
import type { PaginatedResponse, TutorDiscovery } from "@/lib/types";

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

export default function TutorsPage() {
  return (
    <Suspense fallback={<TutorsPageFallback />}>
      <TutorsPageContent />
    </Suspense>
  );
}

function TutorsPageFallback() {
  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-center py-20">
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
      </div>
    </section>
  );
}

function TutorsPageContent() {
  const searchParams = useSearchParams();
  const [tutors, setTutors] = useState<TutorDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [pricingOnly, setPricingOnly] = useState(searchParams.get("has_pricing") === "true");
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<TutorDiscovery | null>(null);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setPricingOnly(searchParams.get("has_pricing") === "true");
  }, [searchParams]);

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
      setTutors([]);
      setNext(null);
    } finally {
      setLoading(false);
    }
  }, [pricingOnly, search]);

  useEffect(() => {
    void loadTutors();
  }, [loadTutors]);

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
      // ignore pagination errors in the marketing grid
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-8 max-w-[720px]">
          <h1 className="text-[2.6rem] font-extrabold text-neutral-900 leading-tight tracking-tight">
            Discover Tutors
          </h1>
          <p className="text-base text-neutral-500 leading-relaxed mt-3.5">
            Search tutors by subject, teaching style, or subscription setup. One subscription unlocks all paid courses, study guides, and live sessions from that tutor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[220px] max-w-[420px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              className="w-full pl-10 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
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
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        ) : tutors.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center">
            <p className="text-sm text-neutral-400">
              {search ? "No tutors matched your search." : "No tutors available yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {tutors.map((tutor, index) => {
                const startingPrice = getStartingPrice(tutor);
                const initials =
                  `${tutor.first_name?.[0] ?? tutor.tutor_name[0] ?? "T"}${tutor.last_name?.[0] ?? ""}`.toUpperCase();
                const accent = [
                  "from-violet-500 to-fuchsia-500",
                  "from-amber-400 to-orange-500",
                  "from-emerald-400 to-teal-500",
                  "from-blue-400 to-cyan-500",
                ][index % 4];

                return (
                  <div
                    key={tutor.id}
                    className="overflow-hidden rounded-[24px] border-[1.5px] border-neutral-200 bg-white transition-all hover:-translate-y-[4px] hover:border-violet-200 hover:shadow-2xl"
                  >
                    <div className={`h-[150px] bg-gradient-to-br ${accent} p-5`}>
                      <div className="flex items-start justify-between">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/35 bg-white/15 text-lg font-extrabold text-white backdrop-blur-sm">
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
                            {tutor.subject_area || "Multi-subject tutor"}
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
                        {tutor.bio || "Explore this tutor's growing library of courses, study guides, and live sessions."}
                      </p>

                      <div className="grid grid-cols-3 gap-2 mb-5 text-center">
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
                          Library access
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
                          disabled={!startingPrice}
                          onClick={() => setPaymentTarget(tutor)}
                        >
                          Subscribe
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {next ? (
              <div className="mt-10 text-center">
                <Button variant="secondary" size="md" loading={loadingMore} onClick={loadMore}>
                  Load more tutors
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {paymentTarget ? (
        <PaymentModal
          open={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => {
            setPaymentTarget(null);
          }}
          tutorId={paymentTarget.id}
          tutorName={paymentTarget.tutor_name}
          title={`All paid content by ${paymentTarget.tutor_name}`}
          plan={paymentTarget.subscription_plan}
          returnTo={`/tutors/${paymentTarget.id}`}
        />
      ) : null}
    </section>
  );
}
