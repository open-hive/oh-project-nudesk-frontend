"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Video, Calendar, Clock, Users, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { LiveClass, Category, PaginatedResponse } from "@/lib/types";
import { Sidebar } from "@/components/discovery/sidebar";

const STATUS_LABELS: Record<LiveClass["status"], string> = {
  pending_review: "Pending Review",
  rejected: "Rejected",
  scheduled: "Scheduled",
  live: "Live Now",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<LiveClass["status"], "green" | "violet" | "neutral" | "red"> = {
  pending_review: "neutral",
  rejected: "red",
  scheduled: "violet",
  live: "green",
  completed: "neutral",
  cancelled: "red",
};

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

const gradients = [
  "from-violet-500 to-fuchsia-500",
  "from-amber-400 to-orange-500",
  "from-green-400 to-emerald-500",
  "from-blue-400 to-cyan-500",
  "from-rose-400 to-pink-500",
];

function parseAccessType(
  value: string | null,
  isFreeValue?: string | null
): "all" | "free" | "subscription" {
  if (value === "free" || value === "subscription") return value;
  if (isFreeValue === "true") return "free";
  if (isFreeValue === "false") return "subscription";
  return "all";
}

export default function LiveSessionsPage() {
  return (
    <Suspense fallback={<LiveSessionsPageFallback />}>
      <LiveSessionsPageContent />
    </Suspense>
  );
}

function LiveSessionsPageFallback() {
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

function LiveSessionsPageContent() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<LiveClass[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [accessType, setAccessType] = useState<"all" | "free" | "subscription">(
    parseAccessType(searchParams.get("access"), searchParams.get("is_free"))
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [startDate, setStartDate] = useState(searchParams.get("start_date") ?? "");
  const [endDate, setEndDate] = useState(searchParams.get("end_date") ?? "");
  const [seatsAvailableOnly, setSeatsAvailableOnly] = useState(
    searchParams.get("seats_available") === "true"
  );
  const [ordering, setOrdering] = useState(searchParams.get("ordering") ?? "soonest");
  const [tutorFilter, setTutorFilter] = useState(searchParams.get("tutor") ?? "");
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setAccessType(parseAccessType(searchParams.get("access"), searchParams.get("is_free")));
    setMinPrice(searchParams.get("min_price") ?? "");
    setMaxPrice(searchParams.get("max_price") ?? "");
    setStatusFilter(searchParams.get("status") ?? "");
    setStartDate(searchParams.get("start_date") ?? "");
    setEndDate(searchParams.get("end_date") ?? "");
    setSeatsAvailableOnly(searchParams.get("seats_available") === "true");
    setOrdering(searchParams.get("ordering") ?? "soonest");
    setTutorFilter(searchParams.get("tutor") ?? "");
  }, [searchParams]);

  const buildUrl = useCallback(
    (base = "/courses/live-classes/") => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (accessType === "free") params.set("is_free", "true");
      if (accessType === "subscription") params.set("is_free", "false");
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);
      if (statusFilter) params.set("status", statusFilter);
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      if (seatsAvailableOnly) params.set("seats_available", "true");
      if (ordering) params.set("ordering", ordering);
      if (tutorFilter) params.set("tutor", tutorFilter);
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },
    [
      search,
      category,
      accessType,
      minPrice,
      maxPrice,
      statusFilter,
      startDate,
      endDate,
      seatsAvailableOnly,
      ordering,
      tutorFilter,
    ]
  );

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<LiveClass>>(buildUrl());
      setSessions(data.results);
      setCount(data.count);
      setNext(data.next);
    } catch {
      setSessions([]);
      setCount(0);
      setNext(null);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    apiFetch<PaginatedResponse<Category>>("/courses/categories/")
      .then((d) => setCategories(d.results))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const url = new URL(next);
      const path = url.pathname + url.search;
      const endpoint = path.replace(/^\/apis/, "");
      const data = await apiFetch<PaginatedResponse<LiveClass>>(endpoint);
      setSessions((prev) => [...prev, ...data.results]);
      setNext(data.next);
    } catch {
      // keep current results if pagination fails
    } finally {
      setLoadingMore(false);
    }
  }

  function clearFilters() {
    setCategory("");
    setAccessType("all");
    setMinPrice("");
    setMaxPrice("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setSeatsAvailableOnly(false);
    setOrdering("soonest");
    setTutorFilter("");
  }

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="mb-8">
          <h1 className="text-[2.6rem] font-extrabold text-neutral-900 leading-tight tracking-tight">
            Live Sessions
          </h1>
          <p className="text-base text-neutral-500 max-w-[520px] leading-relaxed mt-3.5">
            Join live interactive classes with expert tutors and search directly by tutor name or topic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[220px] max-w-[360px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              className="w-full pl-10 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
              placeholder="Search sessions or tutors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-neutral-500">
            <SlidersHorizontal className="w-4 h-4" />
            <span>{count} results</span>
          </div>
        </div>

        {tutorFilter ? (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
            <span>Showing live sessions from a specific tutor.</span>
            <button
              type="button"
              onClick={() => setTutorFilter("")}
              className="font-semibold text-violet-700 transition-colors hover:text-violet-900"
            >
              Show all tutors
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <Sidebar
            variant="live-sessions"
            common={{
              categories,
              category,
              accessType,
              minPrice,
              maxPrice,
              onCategoryChange: setCategory,
              onAccessTypeChange: setAccessType,
              onMinPriceChange: setMinPrice,
              onMaxPriceChange: setMaxPrice,
            }}
            liveFilters={{
              status: statusFilter,
              startDate,
              endDate,
              seatsAvailableOnly,
              ordering,
              onStatusChange: setStatusFilter,
              onStartDateChange: setStartDate,
              onEndDateChange: setEndDate,
              onSeatsAvailableOnlyChange: setSeatsAvailableOnly,
              onOrderingChange: setOrdering,
            }}
            onClear={clearFilters}
          />

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-neutral-400">No live sessions found. Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {sessions.map((s, i) => (
                    <div
                      key={s.id}
                      className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden hover:border-violet-200 hover:shadow-2xl hover:-translate-y-[5px] transition-all"
                    >
                      <div className={`h-[120px] bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center relative`}>
                        <Video className="w-10 h-10 text-white/80" />
                        {s.status === "live" && (
                          <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-bold text-white">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                      <div className="px-[18px] pt-4 pb-5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="text-[.975rem] font-bold leading-[1.4] flex-1">{s.title}</div>
                          <Badge variant={s.is_free ? "green" : "amber"} className="shrink-0">
                            {s.is_free
                              ? "Free"
                              : s.subscription_plan?.monthly_price
                              ? `From BWP ${Number(s.subscription_plan.monthly_price).toFixed(0)}/mo`
                              : "Subscription"}
                          </Badge>
                        </div>
                        <div className="text-[.75rem] text-neutral-400 mb-3">{s.category_name}</div>
                        <p className="text-[.8rem] text-neutral-500 line-clamp-2 mb-3">{s.description}</p>
                        <div className="flex flex-col gap-1.5 mb-3">
                          <div className="flex items-center gap-1.5 text-[.78rem] text-neutral-500">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                            {formatDate(s.scheduled_date)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[.78rem] text-neutral-500">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            {formatTime(s.start_time)} – {formatTime(s.end_time)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[.78rem] text-neutral-500">
                            <Users className="w-3.5 h-3.5 text-neutral-400" />
                            {s.registered_count} / {s.max_capacity} seats
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Link href={`/tutors/${s.tutor}`} className="text-[.8rem] font-medium text-neutral-700 hover:text-violet-700">
                            {s.tutor_name}
                          </Link>
                          <Badge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {next && (
                  <div className="text-center mt-10">
                    <Button variant="secondary" size="md" loading={loadingMore} onClick={loadMore}>
                      Load more sessions
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
