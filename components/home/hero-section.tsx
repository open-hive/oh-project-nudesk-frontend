"use client";

import { ArrowRight, TrendingUp, Users, BookOpen, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Course, Category, PaginatedResponse } from "@/lib/types";

function TutorEarningsCard() {
  return (
    <div className="relative flex justify-center items-center">
      <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-3xl shadow-2xl w-full max-w-[420px] aspect-[1/1.05] p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-violet-300 text-[.7rem] font-semibold uppercase tracking-wider">Your Dashboard</p>
            <p className="text-white font-bold text-sm mt-0.5">Dr. Kefilwe Sithole</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">KS</div>
        </div>

        {/* Earnings highlight */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <p className="text-violet-300 text-[.7rem] font-semibold mb-1">THIS MONTH&apos;S EARNINGS</p>
          <p className="text-white text-3xl font-extrabold tracking-tight">P 4,820</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-[.72rem] font-semibold">+34% from last month</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Students", value: "312" },
            { label: "Courses", value: "4" },
            { label: "Rating", value: "4.9★" },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-white font-extrabold text-base leading-none">{s.value}</p>
              <p className="text-violet-300 text-[.65rem] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-white/10 rounded-2xl p-3 flex-1">
          <p className="text-violet-300 text-[.68rem] font-semibold mb-2 uppercase tracking-wider">Recent Enrollments</p>
          <div className="flex flex-col gap-1.5">
            {[
              { name: "Thabo M.", location: "Gaborone", time: "2m ago" },
              { name: "Lorato K.", location: "Maun", time: "18m ago" },
              { name: "Neo D.", location: "Francistown", time: "1h ago" },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-violet-400/40 flex items-center justify-center text-white text-[.6rem] font-bold">{s.name[0]}</div>
                  <span className="text-white text-[.72rem] font-medium">{s.name}</span>
                  <span className="text-violet-300 text-[.65rem]">· {s.location}</span>
                </div>
                <span className="text-violet-400 text-[.62rem]">{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute bottom-[6%] left-[-8%] bg-white border-[1.5px] border-neutral-200 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5 animate-float">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <div className="text-[.78rem] font-bold text-neutral-900">Payout Sent</div>
          <div className="text-[.7rem] text-neutral-500">P 1,240 · this week</div>
        </div>
      </div>

      <div className="absolute top-[8%] right-[-6%] bg-white border-[1.5px] border-neutral-200 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5 animate-float-delay">
        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <div className="text-[.78rem] font-bold text-neutral-900">Students in 8 towns</div>
          <div className="text-[.7rem] text-neutral-500">No classroom needed</div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="pt-[70px] bg-[linear-gradient(155deg,var(--color-violet-50)_0%,#fff_55%)] min-h-[88vh] flex items-center overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_80%_10%,rgba(124,58,237,.07),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_5%_85%,rgba(249,115,22,.05),transparent)]" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 w-full relative z-[1]">
        <div className="grid grid-cols-2 gap-14 items-center py-16 pb-20">
          <div>
            <div className="inline-flex items-center gap-2 mb-[22px] bg-green-50 border-[1.5px] border-green-200 rounded-full py-[5px] px-4 pl-1.5 text-[.78rem] font-semibold text-green-700">
              <span className="bg-green-600 text-white text-[.68rem] font-bold px-2.5 py-0.5 rounded-full">
                TUTORS
              </span>
              Turn your knowledge into steady income
            </div>

            <h1 className="text-[clamp(2.2rem,3.8vw,3.5rem)] font-extrabold text-neutral-900 leading-[1.12] tracking-[-0.035em] mb-[18px]">
              Teach From Anywhere.
              <br />
              Earn <span className="text-primary">Every Month.</span>
            </h1>

            <p className="text-base text-neutral-500 leading-[1.7] mb-7 max-w-[460px]">
              Create a course once and earn from it for years. Whether you&apos;re in Maun
              and your students are in Gaborone &mdash; NuDesk connects you with learners
              across Botswana and beyond.
            </p>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Button size="lg" href="/auth/signup?role=tutor">
                Start Teaching <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="secondary" size="lg" href="/courses">
                Browse Courses
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[.78rem] text-neutral-500">
              {[
                { icon: <Users className="w-3.5 h-3.5 text-violet-500" />, text: "No minimum student count to earn" },
                { icon: <BookOpen className="w-3.5 h-3.5 text-violet-500" />, text: "Create once, earn indefinitely" },
                { icon: <MapPin className="w-3.5 h-3.5 text-violet-500" />, text: "Reach students nationwide" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <TutorEarningsCard />
        </div>
      </div>
    </section>
  );
}

export function StatsBar() {
  const [courseCount, setCourseCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  useEffect(() => {
    apiFetch<PaginatedResponse<Course>>("/courses/")
      .then((d) => setCourseCount(d.count))
      .catch(() => {});
    apiFetch<PaginatedResponse<Category>>("/courses/categories/")
      .then((d) => setCategoryCount(d.count))
      .catch(() => {});
  }, []);

  const stats = [
    { value: "840+", label: "Active Tutors" },
    { value: "12K+", label: "Students Reached" },
    { value: courseCount > 0 ? `${courseCount.toLocaleString()}+` : "—", label: "Courses Published" },
    { value: categoryCount > 0 ? `${categoryCount}+` : "—", label: "Subjects Covered" },
    { value: "P4.2M+", label: "Paid Out to Tutors" },
  ];

  return (
    <div className="border-t-[1.5px] border-neutral-200 bg-white">
      <div className="max-w-[1200px] mx-auto flex items-stretch">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`flex-1 py-6 px-5 text-center ${
              i < stats.length - 1 ? "border-r-[1.5px] border-neutral-200" : ""
            }`}
          >
            <div className="text-[1.85rem] font-extrabold text-neutral-900 tracking-[-0.03em] leading-none">
              {s.value}
            </div>
            <div className="text-[.78rem] text-neutral-500 mt-1 font-medium">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

