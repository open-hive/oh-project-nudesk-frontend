"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { Course, Category, PaginatedResponse } from "@/lib/types";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildUrl = useCallback(
    (base = "/courses/") => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (freeOnly) params.set("is_free", "true");
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },
    [search, category, freeOnly]
  );

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<Course>>(buildUrl());
      setCourses(data.results);
      setNext(data.next);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    apiFetch<PaginatedResponse<Category>>("/courses/categories/").then((d) =>
      setCategories(d.results)
    ).catch(() => {});
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  async function loadMore() {
    if (!next) return;
    setLoadingMore(true);
    try {
      const url = new URL(next);
      const path = url.pathname + url.search;
      const endpoint = path.replace(/^\/apis/, "");
      const data = await apiFetch<PaginatedResponse<Course>>(endpoint);
      setCourses((prev) => [...prev, ...data.results]);
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
  const emojis = ["📚", "🧠", "🔬", "💡", "🎯"];

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[2.6rem] font-extrabold text-neutral-900 leading-tight tracking-tight">
            All Courses
          </h1>
          <p className="text-base text-neutral-500 max-w-[520px] leading-relaxed mt-3.5">
            Browse courses from expert tutors across all subjects.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[220px] max-w-[360px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              className="w-full pl-10 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
              placeholder="Search courses..."
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
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
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

        {/* Course Grid */}
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
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-neutral-400">No courses found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.slug}`}
                  className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden hover:border-violet-200 hover:shadow-2xl hover:-translate-y-[5px] transition-all"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {c.cover_image ? (
                      <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-[3rem]`}>
                        {emojis[i % emojis.length]}
                      </div>
                    )}
                    <Badge variant={c.is_free ? "green" : "amber"} className="absolute top-3 right-3">
                      {c.is_free ? "Free" : `P${c.price}`}
                    </Badge>
                  </div>
                  <div className="px-[18px] pt-4 pb-5">
                    <div className="text-[.975rem] font-bold leading-[1.4] mb-1">{c.title}</div>
                    <div className="text-[.75rem] text-neutral-400 mb-2">
                      {c.category_name} · {c.module_count} modules
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[.8rem] font-medium text-neutral-700">{c.tutor_name}</span>
                      {c.average_rating != null && c.average_rating > 0 && (
                        <span className="flex items-center gap-0.5 text-[.78rem] text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {c.average_rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {next && (
              <div className="text-center mt-10">
                <Button variant="secondary" size="md" loading={loadingMore} onClick={loadMore}>
                  Load more courses
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

