"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Users, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  {
    Icon: BookOpen,
    value: 1200,
    suffix: "+",
    label: "Courses published by verified tutors",
    bg: "bg-violet-100",
    color: "text-violet-600",
  },
  {
    Icon: Users,
    value: 3500,
    suffix: "+",
    label: "Sessions delivered by tutors on NuDesk",
    bg: "bg-orange-50",
    color: "text-orange-500",
  },
  {
    Icon: Clock,
    value: 20,
    suffix: "+ Hours",
    label: "Average time tutors spend creating and teaching",
    bg: "bg-green-50",
    color: "text-green-600",
  },
  {
    Icon: Star,
    value: 500,
    suffix: "+",
    label: "Active tutors earning on the platform",
    bg: "bg-blue-50",
    color: "text-blue-600",
  },
];

function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [start, target, duration]);

  return count;
}

function StatCard({
  stat,
  inView,
}: {
  stat: (typeof stats)[0];
  inView: boolean;
}) {
  const count = useCountUp(stat.value, 1500, inView);
  return (
    <div className="bg-white border border-[#EBEBEB] rounded-xl p-6 text-center transition-all duration-200 hover:shadow-lg">
      <div
        className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${stat.bg}`}
      >
        <stat.Icon className={`w-6 h-6 ${stat.color}`} />
      </div>
      <div className="text-[1.6rem] font-bold text-neutral-900 tracking-tight leading-none">
        {count.toLocaleString()}
        {stat.suffix}
      </div>
      <div className="text-[13px] text-neutral-500 mt-2 leading-[1.4]">{stat.label}</div>
    </div>
  );
}

export function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-[#F5F7FA] relative overflow-hidden">
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 bg-dot-pattern pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-12">
          <div>
            <h2 className="text-[2rem] font-bold text-neutral-900 leading-[1.3] tracking-[-0.02em]">
              Stats that explain everything
              <br />
              about <span className="text-primary">#Our success</span>
            </h2>
          </div>
          <Button variant="secondary" size="lg" href="/how-it-works" className="shrink-0 border-neutral-300">
            See how it works →
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
