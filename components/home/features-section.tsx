import {
  BookOpen,
  Video,
  PiggyBank,
  Award,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaveDecoration } from "@/components/home/wave-decoration";

const valueProps = [
  {
    Icon: BookOpen,
    title: "Teach any subject",
    desc: "Create courses for any level, from PSLE to university and professional skills.",
    bg: "bg-violet-100",
    color: "text-violet-600",
  },
  {
    Icon: Video,
    title: "Offer flexible sessions",
    desc: "Run video or in-person sessions on your schedule, from anywhere.",
    bg: "bg-orange-50",
    color: "text-orange-500",
  },
  {
    Icon: PiggyBank,
    title: "Earn from your expertise",
    desc: "Set weekly, monthly, and yearly subscription rates and track recurring earnings in one dashboard.",
    bg: "bg-green-50",
    color: "text-green-600",
  },
  {
    Icon: Award,
    title: "Build your reputation",
    desc: "Grow your profile with verified reviews and consistent learner results.",
    bg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    Icon: Users,
    title: "Reach more learners",
    desc: "Get discovered by students nationwide without chasing payments.",
    bg: "bg-amber-50",
    color: "text-amber-600",
  },
  {
    Icon: ShieldCheck,
    title: "Verified tutor profiles",
    desc: "Showcase your credentials with a trusted, verified profile on NuDesk.",
    bg: "bg-fuchsia-50",
    color: "text-purple-600",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Centered heading block */}
        <div className="text-center max-w-[600px] mx-auto mb-14">
          <WaveDecoration />
          <p className="text-[13px] text-neutral-500 mb-2">
            Teach smarter. Earn more.
          </p>
          <h2 className="text-[2rem] font-bold text-neutral-900 leading-[1.2] tracking-[-0.02em] mb-3">
            The platform built for tutors
          </h2>
          <p className="text-[15px] text-neutral-500 leading-[1.6]">
            Create content, host sessions, and grow subscriber income from your knowledge on NuDesk.
          </p>
        </div>

        {/* 3×2 horizontal card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {valueProps.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-[#EBEBEB] rounded-xl p-6 flex items-start gap-4 cursor-pointer transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${f.bg}`}
              >
                <f.Icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <div>
                <div className="text-[15px] font-bold text-neutral-900 mb-1">{f.title}</div>
                <div className="text-[13px] text-neutral-500 leading-[1.5] line-clamp-2">
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button variant="primary" size="lg" href="/auth/signup" className="rounded-xl">
            Apply as a Tutor
          </Button>
        </div>
      </div>
    </section>
  );
}
