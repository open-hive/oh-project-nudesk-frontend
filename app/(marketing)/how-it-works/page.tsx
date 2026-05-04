import { FaqItem } from "@/components/faq-item";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Designed for serious learning. From application to certification.",
};

function StepNumber({ n }: { n: number }) {
  return (
    <div className="w-12 h-12 rounded-full bg-primary-light border-2 border-primary-muted flex items-center justify-center text-base font-extrabold text-primary shrink-0">
      {n}
    </div>
  );
}

const vettingSteps = [
  {
    title: "Application & Credentials",
    desc: "Submit qualifications, teaching experience, and subject expertise. We verify every claim independently.",
  },
  {
    title: "Teaching Demo Review",
    desc: "Our academic panel evaluates a recorded teaching sample for clarity, depth, and pedagogical quality.",
  },
  {
    title: "Background Verification",
    desc: "Reference checks ensure professionalism, integrity, and commitment to student outcomes.",
  },
  {
    title: "Ongoing Performance Monitoring",
    desc: "Continuous ratings and completion tracking. Underperforming tutors are removed from the platform.",
  },
];

const statsCards = [
  { value: "94%", label: "of applications are rejected -- only verified experts approved" },
  { value: "2-3 days", label: "average review time for tutor applications" },
  { value: "840+", label: "approved tutors across 60+ subjects" },
];

const faqs = [
  {
    q: "How do I become a tutor on NuDesk?",
    a: "Sign up using the Tutor option, complete your profile and credentials, and submit a short teaching demo. Our team reviews within 2-3 business days.",
  },
  {
    q: "Is NuDesk free for students?",
    a: "Creating an account is free. You can browse all content and purchase individual courses. Subscribe to NuDesk Plus for unlimited access.",
  },
  {
    q: "How do tutors get paid?",
    a: "Tutors keep 80% of all revenue (90% on Pro). Payouts are processed monthly directly to your verified bank account.",
  },
  {
    q: "Are NuDesk certificates recognized?",
    a: "NuDesk certificates are verifiable digital credentials with a unique shareable URL. Add them to your LinkedIn profile in one click.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="max-w-[600px] mb-14">
            <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary border-[1.5px] border-primary-muted text-[.72rem] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-3.5">
              How It Works
            </div>
            <h1 className="text-[2.6rem] font-extrabold text-neutral-900 leading-tight tracking-tight">
              Designed for Serious Learning
            </h1>
            <p className="text-base text-neutral-500 max-w-[520px] leading-relaxed mt-3.5">
              From application to certification, how NuDesk ensures
              quality at every step.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-14 items-start">
            <div>
              <h3 className="text-xl font-bold mb-6">
                Tutor Vetting Process
              </h3>
              <div className="flex flex-col gap-5">
                {vettingSteps.map((step, i) => (
                  <div key={step.title} className="flex gap-4 items-start">
                    <StepNumber n={i + 1} />
                    <div>
                      <div className="text-[.9rem] font-bold mb-1">
                        {step.title}
                      </div>
                      <div className="text-sm text-neutral-500 leading-relaxed">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {statsCards.map((s) => (
                <div
                  key={s.value}
                  className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-5"
                >
                  <div className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-50">
        <div className="max-w-[660px] mx-auto px-6">
          <h2 className="text-[2.1rem] font-extrabold text-neutral-900 leading-tight tracking-tight text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-2.5">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
