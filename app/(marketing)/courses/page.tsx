"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Star, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { Course, Category, PaginatedResponse } from "@/lib/types";

const LEVELS = ["Basic & Primary", "JCE", "BGCSE", "University", "Short Courses", "Professional"];
const PRICE_RANGES = ["Free", "Under P100", "P100 – P300", "P300 – P500", "Above P500"];
const RATINGS = [5, 4, 3, 2, 1];
const AVAILABILITY = ["Online", "Offline", "Tutor's place", "Student's place"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["6AM–12PM", "12PM–5PM", "After 5PM"];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`}
        />
      ))}
      <span className="text-xs text-neutral-500 ml-1">{rating}.0 / 5.0</span>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-neutral-200 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
        <span className="text-neutral-400 text-xs">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}

function CheckItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="w-4 h-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
      />
      <span className={`text-sm transition-colors ${checked ? "text-violet-600 font-medium" : "text-neutral-600 group-hover:text-neutral-900"}`}>
        {label}
      </span>
    </label>
  );
}

function RadioItem({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="radio"
        name={name}
        className="w-4 h-4 border-neutral-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
      />
      <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
        {label}
      </span>
    </label>
  );
}

function Sidebar() {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  return (
    <aside className="w-[260px] shrink-0 self-start sticky top-[90px]">
      <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl px-5 py-2">

        <SidebarSection title="Subject & Level">
          <select className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10">
            <option value="">Select category</option>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </SidebarSection>

        <SidebarSection title="Price range">
          {PRICE_RANGES.map((r) => <RadioItem key={r} label={r} name="price_range" />)}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-2.5 py-1.5 border-[1.5px] border-neutral-200 rounded-lg text-xs outline-none focus:border-violet-600"
            />
            <span className="text-neutral-400 text-xs shrink-0">–</span>
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-2.5 py-1.5 border-[1.5px] border-neutral-200 rounded-lg text-xs outline-none focus:border-violet-600"
            />
          </div>
        </SidebarSection>

        <SidebarSection title="Instructor availability">
          <div className="flex flex-col gap-1.5">
            {TIMES.map((t) => <CheckItem key={t} label={t} />)}
          </div>
        </SidebarSection>

        <SidebarSection title="Day of week">
          <div className="grid grid-cols-4 gap-1.5">
            {DAYS.map((d) => {
              const [sel, setSel] = useState(false);
              return (
                <button
                  key={d}
                  onClick={() => setSel(!sel)}
                  className={`py-1 rounded-lg text-xs font-medium border transition-colors ${
                    sel
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-violet-400 hover:text-violet-600"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </SidebarSection>

        <SidebarSection title="Rating">
          {RATINGS.map((r) => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                className="w-4 h-4 border-neutral-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <StarRow rating={r} />
            </label>
          ))}
        </SidebarSection>

        <SidebarSection title="Tutor location">
          <select className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 mb-2">
            <option value="">Select Country</option>
            <option>Botswana</option>
          </select>
          <select className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 mb-2">
            <option value="">Select state from list</option>
            <option>South East</option>
            <option>North East</option>
            <option>Kweneng</option>
            <option>Central</option>
            <option>North West</option>
            <option>Kgatleng</option>
          </select>
          <input
            type="text"
            placeholder="Enter City"
            className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 mb-2"
          />
          <input
            type="text"
            placeholder="Enter address or zipcode"
            className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 mb-2"
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-500">Radius in km</span>
            <input type="range" min={1} max={100} defaultValue={2} className="flex-1" />
            <span className="text-xs font-semibold text-neutral-700">2km</span>
          </div>
        </SidebarSection>

        <SidebarSection title="Miscellaneous">
          {AVAILABILITY.map((a) => <CheckItem key={a} label={a} />)}
        </SidebarSection>

        <div className="pt-4 pb-2 flex flex-col gap-2">
          <button className="w-full py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors">
            Apply filters
          </button>
          <button className="w-full py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
            Clear all filters
          </button>
        </div>
      </div>
    </aside>
  );
}

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
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [buildUrl]);

  useEffect(() => {
    apiFetch<PaginatedResponse<Category>>("/courses/categories/")
      .then((d) => setCategories(d.results))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

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
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[2.6rem] font-extrabold text-neutral-900 leading-tight tracking-tight">
            All Courses
          </h1>
          <p className="text-base text-neutral-500 max-w-[520px] leading-relaxed mt-3.5">
            Browse courses from expert tutors across all subjects.
          </p>
        </div>

        {/* Top filters bar — wired up, working as-is */}
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
          <div className="ml-auto flex items-center gap-2 text-sm text-neutral-500">
            <SlidersHorizontal className="w-4 h-4" />
            <span>{courses.length} results</span>
          </div>
        </div>

        {/* Body: sidebar + grid */}
        <div className="flex gap-8 items-start">
          <Sidebar />

          {/* Course grid */}
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
        </div>
      </div>
    </section>
  );
}