import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <div className="bg-neutral-900 py-24 text-center relative overflow-hidden">
      {/* Subtle gradient accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(124,58,237,.18),transparent)]" />
      </div>
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-violet-900/60 text-violet-300 border-[1.5px] border-violet-700 text-[.72rem] font-bold px-3.5 py-1 rounded-full uppercase tracking-[0.07em] mb-5 justify-center">
          Start Earning Today
        </div>
        <h2 className="text-[2.8rem] font-extrabold text-white text-center mb-4 tracking-[-0.03em] leading-[1.15] max-w-[620px] mx-auto">
          Your Knowledge Is Worth More Than You&apos;re Charging For It
        </h2>
        <p className="text-neutral-400 text-center text-[1.05rem] mb-9 max-w-[520px] mx-auto leading-[1.65]">
          Join 840+ tutors who are earning from their expertise on NuDesk — no classroom required,
          no technical skills needed, and no chasing payments.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="primary" size="xl" href="/auth/signup?role=tutor">
            Apply as a Tutor <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="xl"
            className="border-neutral-700 text-neutral-200 hover:bg-neutral-800"
            href="/courses"
          >
            Browse Courses First
          </Button>
        </div>
        <p className="text-neutral-600 text-sm mt-6">
          Free to apply · Applications reviewed within 48 hours · No lock-in contracts
        </p>
      </div>
    </div>
  );
}
