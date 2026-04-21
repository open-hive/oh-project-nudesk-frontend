"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { StudyGuide, Category, PaginatedResponse } from "@/lib/types";

export default function StudyGuidesPage() {
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildUrl = useCallback(
    (base = "/courses/study-guides/") => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (freeOnly) params.set("is_free", "true");
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },
    [search, category, freeOnly]
  );

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<StudyGuide>>(buildUrl());
      setGuides(data.results);
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
    fetchGuides();
  }, [fetchGuides]);

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const url = new URL(next);
      const path = url.pathname + url.search;
      const endpoint = path.replace(/^\/apis/, "");
      const data = await apiFetch<PaginatedResponse<StudyGuide>>(endpoint);
      setGuides((prev) => [...prev, ...data.results]);
      setNext(data.next);
    } catch {
      /* silent */
    } finally {
      setLoadingMore(false);
    }
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
            Study Guides
          </h1>
          <p className="text-base text-neutral-500 max-w-[520px] leading-relaxed mt-3.5">
            Download expert-written study guides and reference materials across all subjects.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[220px] max-w-[360px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              className="w-full pl-10 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
              placeholder="Search study guides..."
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

        {/* Guides Grid */}
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
        ) : guides.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-neutral-400">
              No study guides found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {guides.map((g, i) => (
                <div
                  key={g.id}
                  className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden hover:border-violet-200 hover:shadow-2xl hover:-translate-y-[5px] transition-all"
                >
                  {/* Cover */}
                  <div
                    className={`h-[140px] bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center`}
                  >
                    <FileText className="w-12 h-12 text-white/80" />
                  </div>

                  <div className="px-[18px] pt-4 pb-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-[.975rem] font-bold leading-[1.4] flex-1">
                        {g.title}
                      </div>
                      <Badge variant={g.is_free ? "green" : "amber"} className="shrink-0">
                        {g.is_free ? "Free" : `P${g.price}`}
                      </Badge>
                    </div>
                    <div className="text-[.75rem] text-neutral-400 mb-3">
                      {g.category_name}
                      {g.page_count > 0 && ` · ${g.page_count} pages`}
                    </div>
                    <p className="text-[.8rem] text-neutral-500 line-clamp-2 mb-3">
                      {g.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[.8rem] font-medium text-neutral-700">
                        {g.tutor_name}
                      </span>
                      <span className="flex items-center gap-1 text-[.75rem] text-neutral-400">
                        <Download className="w-3.5 h-3.5" />
                        {g.download_count}
                      </span>
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
                  Load more guides
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
