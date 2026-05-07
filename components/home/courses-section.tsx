"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { apiFetch } from "@/lib/api";
import type { Course, PaginatedResponse } from "@/lib/types";

const gradients = [
  "from-violet-100 to-violet-200",
  "from-orange-50 to-orange-100",
  "from-green-50 to-green-100",
  "from-blue-50 to-blue-100",
];
const emojis = ["C", "K", "S", "I"];

export function CoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    apiFetch<PaginatedResponse<Course>>("/courses/")
      .then((d) => setCourses(d.results.slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-end justify-between mb-9 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary border-[1.5px] border-primary-muted text-[.72rem] font-bold px-3.5 py-1 rounded-full uppercase tracking-[0.07em] mb-3.5">
              <StarRating rating={1} max={1} /> Top Rated
            </div>
            <h2 className="text-[2.1rem] font-extrabold text-neutral-900 leading-[1.2] tracking-[-0.03em] mb-3.5">
              Most Popular Courses
            </h2>
            <p className="text-base text-neutral-500 max-w-[520px] leading-[1.65]">
              Hand-picked from our best-reviewed tutors.
            </p>
          </div>
          <Button variant="outline-v" href="/courses">All Courses</Button>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">Loading courses...</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5">
            {courses.map((c, i) => (
              <Link
                key={c.id}
                href={`/courses/${c.slug}`}
                className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden transition-all duration-200 hover:shadow-2xl hover:-translate-y-[5px] hover:border-violet-200 cursor-pointer"
              >
                <div className="aspect-video overflow-hidden relative flex items-center justify-center">
                  {c.cover_image ? (
                    <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-[3rem]`}>
                      {emojis[i % emojis.length]}
                    </div>
                  )}
                  <Badge
                    variant={c.is_free ? "green" : "amber"}
                    className="absolute top-3 right-3"
                  >
                    {c.is_free
                      ? "Free"
                      : c.subscription_plan?.monthly_price
                      ? `From BWP ${Number(c.subscription_plan.monthly_price).toFixed(0)}/mo`
                      : "Subscription"}
                  </Badge>
                </div>
                <div className="px-[18px] py-4 pb-5">
                  <Badge variant="violet" className="mb-2">{c.category_name}</Badge>
                  <div className="text-[.975rem] font-bold text-neutral-900 leading-snug mb-2 line-clamp-2">
                    {c.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3 flex-wrap">
                    {c.average_rating != null && c.average_rating > 0 && (
                      <>
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {c.average_rating.toFixed(1)}
                        </span>
                        <span>({c.review_count})</span>
                        <span className="w-[3px] h-[3px] rounded-full bg-neutral-300 shrink-0" />
                      </>
                    )}
                    <span>{c.module_count} modules</span>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-neutral-200">
                    <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[.65rem] font-bold">
                      {c.tutor_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="text-[.8rem] font-medium text-neutral-700">{c.tutor_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
