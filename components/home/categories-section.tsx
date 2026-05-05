import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WaveDecoration } from "@/components/home/wave-decoration";
import {
  BookOpen,
  GraduationCap,
  Award,
  Laptop,
  School,
} from "lucide-react";

const categories = [
  { name: "Basic & Primary", count: "45 Tutors", Icon: School, gradient: "from-violet-600 to-violet-800" },
  { name: "O-Level / JCE", count: "38 Tutors", Icon: BookOpen, gradient: "from-orange-500 to-orange-700" },
  { name: "BGCSE / A-Level", count: "52 Tutors", Icon: GraduationCap, gradient: "from-green-600 to-green-800" },
  { name: "University", count: "29 Tutors", Icon: Award, gradient: "from-blue-600 to-blue-800" },
  { name: "IT & Technology", count: "31 Tutors", Icon: Laptop, gradient: "from-fuchsia-600 to-fuchsia-800" },
];

export function CategoriesSection() {
  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Centered heading */}
        <div className="text-center max-w-[600px] mx-auto mb-12">
          <WaveDecoration />
          <p className="text-[13px] text-neutral-500 mb-2">
            Let&apos;s make a quick start today
          </p>
          <h2 className="text-[2rem] font-bold text-neutral-900 leading-[1.2] tracking-[-0.02em] mb-3">
            Our top visited categories
          </h2>
          <p className="text-[15px] text-neutral-500 leading-[1.6]">
            Explore tutors across every level of the Botswana curriculum from primary school to university and beyond.
          </p>
        </div>

        {/* Category cards — horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 md:grid md:grid-cols-5 md:overflow-visible">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href="/courses"
              className="group relative flex-shrink-0 w-[200px] md:w-auto rounded-2xl overflow-hidden cursor-pointer snap-start"
            >
              {/* Gradient background with icon */}
              <div className={`h-[280px] bg-gradient-to-br ${cat.gradient} relative flex items-center justify-center transition-transform duration-400 group-hover:scale-105`}>
                <cat.Icon className="w-16 h-16 text-white/20" />
                {/* Dark gradient overlay from bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
              </div>
              {/* Text overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 transition-transform duration-300 group-hover:-translate-y-1">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <cat.Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-base font-bold text-white">{cat.name}</div>
                <div className="text-[13px] text-white/70">{cat.count}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Dots */}
        <div className="flex gap-1.5 justify-center mt-6">
          <div className="w-4 h-1 rounded-full bg-primary" />
          <div className="w-4 h-1 rounded-full bg-neutral-300" />
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <Button variant="primary" size="lg" href="/courses" className="rounded-xl">
            Let&apos;s make a quick start today →
          </Button>
        </div>
      </div>
    </section>
  );
}
