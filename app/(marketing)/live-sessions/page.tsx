"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Video, Calendar, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { LiveClass, Category, PaginatedResponse } from "@/lib/types";

const STATUS_LABELS: Record<LiveClass["status"], string> = {
  pending_review: "Pending Review",
  rejected: "Rejected",
  scheduled: "Scheduled",
  live: "Live Now",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<
  LiveClass["status"],
  "green" | "violet" | "neutral" | "red"
> = {
  pending_review: "neutral",
  rejected: "red",
  scheduled: "violet",
  live: "green",
  completed: "neutral",
  cancelled: "red",
};

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveClass[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildUrl = useCallback(
    (base = "/courses/live-classes/") => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (freeOnly) params.set("is_free", "true");
      if (statusFilter) params.set("status", statusFilter);
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },
    [search, category, freeOnly, statusFilter]
  );

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<LiveClass>>(buildUrl());
      setSessions(data.results);
      setNext(data.next);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    apiFetch<PaginatedResponse<Category>>("/courses/categories/")
      .then((d) => setCategories(d.results))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSessions();
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
      /* silent */
    } finally {
      setLoadingMore(false);
    }
  }

  function formatTime(time: string) {
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const gradients = [
    "from-violet-500 to-fuchsia-500",
    "from-amber-400 to-orange-500",
    "from-green-400 to-emerald-500",
    "from-blue-400 to-cyan-500",
    "from-rose-400 to-pink-500",
  ];

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[2.6rem] font-extrabold text-neutral-900 leading-tight tracking-tight">
            Live Sessions
          </h1>
          <p className="text-base text-neutral-500 max-w-[520px] leading-relaxed mt-3.5">
            Join live interactive classes with expert tutors. Ask questions, get
            instant feedback, and learn together.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[220px] max-w-[360px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              className="w-full pl-10 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            className="px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live Now</option>
            <option value="completed">Completed</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
            />
            Free only
          </label>
        </div>

        {/* Sessions Grid */}
        {loading ? (
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
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-neutral-400">
              No live sessions found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessions.map((s, i) => (
                <div
                  key={s.id}
                  className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden hover:border-violet-200 hover:shadow-2xl hover:-translate-y-[5px] transition-all"
                >
                  {/* Banner */}
                  <div
                    className={`h-[120px] bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center relative`}
                  >
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
                      <div className="text-[.975rem] font-bold leading-[1.4] flex-1">
                        {s.title}
                      </div>
                      <Badge
                        variant={
                          s.is_free
                            ? "green"
                            : STATUS_VARIANTS[s.status] === "green"
                            ? "green"
                            : "amber"
                        }
                        className="shrink-0"
                      >
                        {s.is_free ? "Free" : `P${s.price}`}
                      </Badge>
                    </div>

                    <div className="text-[.75rem] text-neutral-400 mb-3">
                      {s.category_name}
                    </div>

                    <p className="text-[.8rem] text-neutral-500 line-clamp-2 mb-3">
                      {s.description}
                    </p>

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
                      <span className="text-[.8rem] font-medium text-neutral-700">
                        {s.tutor_name}
                      </span>
                      <Badge variant={STATUS_VARIANTS[s.status]}>
                        {STATUS_LABELS[s.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {next && (
              <div className="text-center mt-10">
                <Button
                  variant="secondary"
                  size="md"
                  loading={loadingMore}
                  onClick={loadMore}
                >
                  Load more sessions
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
