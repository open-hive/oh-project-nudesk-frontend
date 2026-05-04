"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

const testimonials = [
  {
    initials: "OM",
    name: "Olumide Martins",
    role: "Mathematics Tutor, Maun",
    color: "orange" as const,
    headline: "I stopped chasing payments and started earning consistently",
    quote:
      "I was teaching privately in Maun for years, charging per session, chasing parents for payment. NuDesk changed everything. I uploaded my maths course and students across the country started enrolling. My income doubled in three months.",
  },
  {
    initials: "AM",
    name: "Dr. Ama Mensah",
    role: "Chemistry Tutor, Gaborone",
    color: "green" as const,
    headline: "My study guides earn every month",
    quote:
      "I was skeptical at first. I did not think people would pay for online content in Botswana. I was wrong. My chemistry study guides bring in consistent income every month. The platform handles payments. I just create content.",
  },
  {
    initials: "KA",
    name: "Prof. Kwame Asante",
    role: "Physics Tutor, Gaborone",
    color: "violet" as const,
    headline: "Live sessions feel like a lecture hall, minus the commute",
    quote:
      "The live session feature is a game changer. I schedule sessions each week and students from across Botswana join in real time. It feels like a proper lecture hall without the commute. And I get paid automatically.",
  },
  {
    initials: "NS",
    name: "Neo S.",
    role: "English Tutor, Francistown",
    color: "orange" as const,
    headline: "I teach once and earn from enrollments",
    quote:
      "I used to only earn when I had time for one on one sessions. Now I have a structured course and students enroll anytime. I still tutor, but my course income is steady month after month.",
  },
  {
    initials: "TD",
    name: "Thato D.",
    role: "Accounting Tutor, Gaborone",
    color: "green" as const,
    headline: "Students find me without ads",
    quote:
      "NuDesk helped me get discovered without spending money on advertising. My profile and course reviews do the work, and I can focus on teaching and improving my content.",
  },
  {
    initials: "LB",
    name: "Lorato B.",
    role: "Science Tutor, Kasane",
    color: "violet" as const,
    headline: "One dashboard for content, sessions, and earnings",
    quote:
      "What I like most is that everything is in one place. I manage my course modules, schedule sessions, and track earnings without spreadsheets or manual follow ups.",
  },
];

export function TestimonialsSection() {
  const cardsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / cardsPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 6000);
    return () => clearInterval(timer);
  }, [totalPages]);

  const visibleCards = testimonials.slice(
    currentPage * cardsPerPage,
    currentPage * cardsPerPage + cardsPerPage
  );

  return (
    <section className="py-20 bg-[#F5F7FA]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
          <h2 className="text-[2rem] font-bold text-neutral-900 leading-[1.3] tracking-[-0.02em]">
            See how tutors on NuDesk
            <br />
            are growing their <span className="text-primary">#Success Stories</span>
          </h2>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() =>
                setCurrentPage((p) => (p - 1 + totalPages) % totalPages)
              }
              className="w-10 h-10 rounded-full border border-neutral-300 bg-white flex items-center justify-center text-neutral-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => (p + 1) % totalPages)}
              className="w-10 h-10 rounded-full border border-neutral-300 bg-white flex items-center justify-center text-neutral-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {visibleCards.map((t) => (
            <div
              key={t.name + t.headline}
              className="bg-white rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-[3px] flex flex-col animate-fade-up"
            >
              <Avatar
                initials={t.initials}
                size="lg"
                color={t.color}
                className="mb-4"
              />
              <h3 className="text-[15px] font-bold text-neutral-900 mb-3 leading-snug">
                {t.headline}
              </h3>
              <p className="text-[13px] text-neutral-500 leading-[1.5] mb-5 flex-1">
                &ldquo; {t.quote} &rdquo;
              </p>
              <div className="border-t border-neutral-200 pt-4">
                <div className="text-[13px] font-bold text-neutral-900">{t.name}</div>
                <div className="text-[12px] text-neutral-500">{t.role}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex gap-1.5 justify-center mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-4 h-1 rounded-full transition-colors cursor-pointer ${
                i === currentPage ? "bg-primary" : "bg-neutral-300"
              }`}
              aria-label={`Go to testimonials page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
