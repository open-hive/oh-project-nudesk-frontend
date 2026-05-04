import Link from "next/link";
import { UserPlus, UploadCloud, Banknote } from "lucide-react";

const steps = [
  {
    number: "01",
    Icon: UserPlus,
    title: "Apply as a Tutor",
    desc: "Submit your credentials and a short teaching sample. Our team reviews your application and gets back to you within 48 hours.",
    color: "bg-violet-600",
    light: "bg-primary-light",
    text: "text-primary",
  },
  {
    number: "02",
    Icon: UploadCloud,
    title: "Create Your Content",
    desc: "Upload video modules, host live sessions, or sell study guides. Our tools make it simple no technical skills required.",
    color: "bg-orange-500",
    light: "bg-accent-light",
    text: "text-accent",
  },
  {
    number: "03",
    Icon: Banknote,
    title: "Get Paid Every Month",
    desc: "Students enrol, you earn. Track your income in real time and receive monthly payouts directly to your account no chasing anyone.",
    color: "bg-green-600",
    light: "bg-success-light",
    text: "text-success",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[520px] mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary border-[1.5px] border-primary-muted text-[.72rem] font-bold px-3.5 py-1 rounded-full uppercase tracking-[0.07em] mb-3.5">
            How It Works
          </div>
          <h2 className="text-[2.6rem] font-extrabold text-neutral-900 leading-[1.2] tracking-[-0.03em]">
            Three Steps to Start Earning
          </h2>
          <p className="text-base text-neutral-500 mx-auto leading-[1.65] mt-3.5">
            From application to first payout the whole process is straightforward
            and built to get you earning fast.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="absolute top-[52px] left-[calc(16.6%+24px)] right-[calc(16.6%+24px)] h-[2px] bg-gradient-to-r from-violet-200 via-orange-200 to-green-200 hidden md:block" />

          {steps.map((step) => (
            <div key={step.number} className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-7 text-center relative transition-all duration-200 hover:shadow-xl hover:-translate-y-[3px]">
              <div className={`w-14 h-14 rounded-2xl ${step.light} flex items-center justify-center mx-auto mb-5 relative z-10`}>
                <step.Icon className={`w-7 h-7 ${step.text}`} />
              </div>
              <div className={`absolute top-5 right-5 text-[.65rem] font-black ${step.text} opacity-30 tracking-widest`}>
                {step.number}
              </div>
              <h3 className="text-[1.05rem] font-extrabold text-neutral-900 mb-2.5">
                {step.title}
              </h3>
              <p className="text-sm text-neutral-500 leading-[1.65]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-neutral-400 mt-8">
          Ready to start?{" "}
          <Link href="/auth/signup?role=tutor" className="text-violet-600 font-semibold hover:underline">
            Apply as a tutor it&apos;s free
          </Link>
        </p>
      </div>
    </section>
  );
}
