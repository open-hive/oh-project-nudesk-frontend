"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/discovery/sidebar";
import { apiFetch } from "@/lib/api";
import type { Category, Course, PaginatedResponse } from "@/lib/types";

function parseAccessType(
  value: string | null,
  isFreeValue?: string | null
): "all" | "free" | "subscription" {
  if (value === "free" || value === "subscription") return value;
  if (isFreeValue === "true") return "free";
  if (isFreeValue === "false") return "subscription";
  return "all";
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesPageFallback />}>
      <CoursesPageContent />
    </Suspense>
  );
}

function CoursesPageFallback() {
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

function CoursesPageContent() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
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
  const [minRating, setMinRating] = useState(searchParams.get("min_rating") ?? "");
  const [minModules, setMinModules] = useState(searchParams.get("min_modules") ?? "");
  const [maxModules, setMaxModules] = useState(searchParams.get("max_modules") ?? "");
  const [ordering, setOrdering] = useState(searchParams.get("ordering") ?? "newest");
  const [tutorFilter, setTutorFilter] = useState(searchParams.get("tutor") ?? "");
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setCategory(searchParams.get("category") ?? "");
    setAccessType(parseAccessType(searchParams.get("access"), searchParams.get("is_free")));
    setMinPrice(searchParams.get("min_price") ?? "");
    setMaxPrice(searchParams.get("max_price") ?? "");
    setMinRating(searchParams.get("min_rating") ?? "");
    setMinModules(searchParams.get("min_modules") ?? "");
    setMaxModules(searchParams.get("max_modules") ?? "");
    setOrdering(searchParams.get("ordering") ?? "newest");
    setTutorFilter(searchParams.get("tutor") ?? "");
  }, [searchParams]);

  const buildUrl = useCallback(
    (base = "/courses/") => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (accessType === "free") params.set("is_free", "true");
      if (accessType === "subscription") params.set("is_free", "false");
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);
      if (minRating) params.set("min_rating", minRating);
      if (minModules) params.set("min_modules", minModules);
      if (maxModules) params.set("max_modules", maxModules);
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
      minRating,
      minModules,
      maxModules,
      ordering,
      tutorFilter,
    ]
  );

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<Course>>(buildUrl());
      setCourses(data.results);
      setCount(data.count);
      setNext(data.next);
    } catch {
      setCourses([]);
      setCount(0);
      setNext(null);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    apiFetch<PaginatedResponse<Category>>("/courses/categories/")
      .then((data) => setCategories(data.results))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    void fetchCourses();
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
    setMinRating("");
    setMinModules("");
    setMaxModules("");
    setOrdering("newest");
    setTutorFilter("");
  }

  const gradients = [
    "from-violet-500 to-fuchsia-500",
    "from-amber-400 to-orange-500",
    "from-green-400 to-emerald-500",
    "from-blue-400 to-cyan-500",
    "from-rose-400 to-pink-500",
  ];
  const emojis = ["C", "K", "S", "I", "G"];

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-[2.6rem] font-extrabold text-neutral-900 leading-tight tracking-tight">
            All Courses
          </h1>
          <p className="text-base text-neutral-500 max-w-[520px] leading-relaxed mt-3.5">
            Browse courses from expert tutors across all subjects, or search directly by tutor name.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[220px] max-w-[420px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              className="w-full pl-10 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
              placeholder="Search courses or tutors..."
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
            <span>Showing courses from a specific tutor.</span>
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
            variant="courses"
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
            courseFilters={{
              minRating,
              minModules,
              maxModules,
              ordering,
              onMinRatingChange: setMinRating,
              onMinModulesChange: setMinModules,
              onMaxModulesChange: setMaxModules,
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
            ) : courses.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-neutral-400">No courses found. Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {courses.map((course, index) => (
                    <div
                      key={course.id}
                      className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden hover:border-violet-200 hover:shadow-2xl hover:-translate-y-[5px] transition-all"
                    >
                      <Link href={`/courses/${course.slug}`} className="block">
                        <div className="relative aspect-video overflow-hidden">
                          {course.cover_image ? (
                            <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center text-[3rem]`}>
                              {emojis[index % emojis.length]}
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="px-[18px] pt-4 pb-5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Link href={`/courses/${course.slug}`} className="text-[.975rem] font-bold leading-[1.4] flex-1 hover:text-violet-700 transition-colors">
                            {course.title}
                          </Link>
                          <Badge variant={course.is_free ? "green" : "amber"} className="shrink-0">
                            {course.is_free
                              ? "Free"
                              : course.subscription_plan?.monthly_price
                              ? `From BWP ${Number(course.subscription_plan.monthly_price).toFixed(0)}/mo`
                              : "Subscription"}
                          </Badge>
                        </div>

                        <div className="text-[.75rem] text-neutral-400 mb-3">
                          {course.category_name} · {course.module_count} modules
                        </div>

                        <p className="text-[.8rem] text-neutral-500 line-clamp-2 mb-3">
                          {course.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <Link
                            href={`/tutors/${course.tutor}`}
                            className="text-[.8rem] font-medium text-neutral-700 hover:text-violet-700"
                          >
                            {course.tutor_name}
                          </Link>
                          {course.average_rating ? (
                            <span className="flex items-center gap-1 text-[.75rem] text-amber-500 font-semibold">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              {course.average_rating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-[.75rem] text-neutral-400">
                              {course.review_count} reviews
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {next ? (
                  <div className="text-center mt-10">
                    <Button variant="secondary" size="md" loading={loadingMore} onClick={loadMore}>
                      Load more courses
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
