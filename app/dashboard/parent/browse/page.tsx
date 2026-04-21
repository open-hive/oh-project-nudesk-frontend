"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Loader2,
  Search,
  BookOpen,
  Star,
  ShoppingCart,
  ChevronDown,
  X,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { parentApi } from "@/lib/api";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { useToast } from "@/components/ui/toast";
import type { Course, ChildSummary, PaginatedResponse } from "@/lib/types";

const GRADIENTS = [
  "from-violet-50 to-violet-100",
  "from-orange-50 to-orange-100",
  "from-green-50 to-emerald-100",
  "from-amber-50 to-amber-100",
];
const EMOJIS = ["📐", "⚛️", "🧪", "💻"];

export default function ParentBrowsePage() {
  const { tokens } = useAuth();
  const toast = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Child selector modal state
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildSummary | null>(null);

  // Payment modal state
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const [coursesData, childrenData] = await Promise.all([
        apiFetch<PaginatedResponse<Course>>("/courses/"),
        parentApi.getChildren(tokens.access),
      ]);
      setCourses(coursesData.results ?? []);
      setChildren(childrenData);
    } catch {
      toast.error("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, [tokens, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tutor_name.toLowerCase().includes(search.toLowerCase()) ||
      c.category_name.toLowerCase().includes(search.toLowerCase())
  );

  function openEnroll(course: Course) {
    setSelectedCourse(course);
    if (children.length === 1) {
      setSelectedChild(children[0]);
      setPayOpen(true);
    } else {
      setSelectorOpen(true);
    }
  }

  function handleChildSelect(child: ChildSummary) {
    setSelectedChild(child);
    setSelectorOpen(false);
    setPayOpen(true);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Browse &amp; Enroll
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Find courses and enroll your children.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          placeholder="Search courses, tutors, or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border-[1.5px] border-neutral-200 rounded-[12px] text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/60"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">
            {search ? "No courses matched your search." : "No courses available."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course, idx) => (
            <div
              key={course.id}
              className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden hover:border-orange-200 hover:shadow-xl hover:-translate-y-[4px] transition-all"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                {course.cover_image ? (
                  <Image
                    src={course.cover_image}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${
                      GRADIENTS[idx % GRADIENTS.length]
                    } flex items-center justify-center text-3xl`}
                  >
                    {EMOJIS[idx % EMOJIS.length]}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[.7rem] bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                    {course.category_name}
                  </span>
                  {course.is_free && (
                    <span className="text-[.7rem] bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full">
                      Free
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-neutral-900 text-sm leading-snug mb-1 line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-xs text-neutral-500 mb-2">
                  by {course.tutor_name}
                </p>

                {course.average_rating != null && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-neutral-700">
                      {course.average_rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({course.review_count})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <span className="text-base font-bold text-neutral-900">
                    {course.is_free
                      ? "Free"
                      : `P${parseFloat(course.price).toLocaleString("en-BW", {
                          minimumFractionDigits: 2,
                        })}`}
                  </span>
                  <button
                    onClick={() => openEnroll(course)}
                    disabled={children.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[10px] text-xs font-semibold transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Enroll
                  </button>
                </div>

                {children.length === 0 && (
                  <p className="text-[.7rem] text-neutral-400 mt-1.5">
                    Link a child first to enroll them.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Child selector modal */}
      {selectorOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectorOpen(false)}
          />
          <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-neutral-900">
                  Select a Child
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                  Enrolling in: {selectedCourse.title}
                </p>
              </div>
              <button
                onClick={() => setSelectorOpen(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {children.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-7 h-7 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">No linked children.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <button
                    key={child.child_id}
                    onClick={() => handleChildSelect(child)}
                    className="w-full flex items-center gap-3 p-3 border border-neutral-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {child.first_name[0]}
                      {child.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-neutral-900 truncate">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {child.email}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-neutral-300 ml-auto rotate-[-90deg] flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment modal */}
      {selectedCourse && selectedChild && (
        <PaymentModal
          open={payOpen}
          onClose={() => {
            setPayOpen(false);
            setSelectedChild(null);
            setSelectedCourse(null);
          }}
          onSuccess={() => {
            toast.success(
              `${selectedChild.first_name} has been enrolled in ${selectedCourse.title}!`
            );
            setPayOpen(false);
            setSelectedChild(null);
            setSelectedCourse(null);
          }}
          contentType="course"
          contentId={selectedCourse.id}
          price={selectedCourse.price}
          title={selectedCourse.title}
          childId={selectedChild.child_id}
        />
      )}
    </div>
  );
}
