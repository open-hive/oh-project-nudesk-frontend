"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PricingCard = {
  tier: string;
  price: string;
  unit?: string;
  tagline: string;
  cta: string;
  ctaVariant: "primary" | "outline-v";
  href: string;
  popular?: boolean;
  badge?: string;
  features: string[];
};

const learnerPlans: PricingCard[] = [
  {
    tier: "Free Access",
    price: "P0",
    tagline: "Create an account, explore tutors, and start with free content.",
    cta: "Start Free",
    ctaVariant: "outline-v",
    href: "/auth/signup",
    features: [
      "Browse tutors and content",
      "Join free courses and resources",
      "Track progress in your dashboard",
    ],
  },
  {
    tier: "Weekly",
    price: "Tutor-set",
    unit: "per tutor",
    tagline: "Best for short exam prep, bootcamps, or focused revision.",
    cta: "Find a Tutor",
    ctaVariant: "outline-v",
    href: "/tutors",
    features: [
      "Unlimited access to one tutor's content",
      "Includes courses, study guides, and live sessions",
      "Great for short-term learning goals",
    ],
  },
  {
    tier: "Monthly",
    price: "Tutor-set",
    unit: "per tutor",
    tagline: "The most flexible option for ongoing learning.",
    cta: "Choose Monthly",
    ctaVariant: "primary",
    href: "/tutors",
    popular: true,
    badge: "Most Popular",
    features: [
      "Unlimited access to that tutor's full library",
      "Good for steady progress across a full subject",
      "Parents can subscribe on behalf of a child",
    ],
  },
  {
    tier: "Yearly",
    price: "Tutor-set",
    unit: "per tutor",
    tagline: "Best value for long-term support and full-year mastery.",
    cta: "Choose Yearly",
    ctaVariant: "outline-v",
    href: "/tutors",
    features: [
      "Unlimited access all year",
      "Works well for full academic cycles",
      "One subscription unlocks all that tutor's paid content",
    ],
  },
];

const tutorPlans: PricingCard[] = [
  {
    tier: "Set Your Rates",
    price: "You decide",
    tagline: "Configure weekly, monthly, and yearly subscription pricing.",
    cta: "Apply as Tutor",
    ctaVariant: "primary",
    href: "/auth/signup?role=tutor",
    popular: true,
    badge: "Tutor Control",
    features: [
      "Choose your own subscription prices",
      "Offer one library across courses, guides, and live sessions",
      "Update pricing anytime from your dashboard",
    ],
  },
  {
    tier: "Revenue Share",
    price: "85%",
    unit: "tutor payout",
    tagline: "The platform keeps 15% and pays out the rest to tutors.",
    cta: "View How It Works",
    ctaVariant: "outline-v",
    href: "/how-it-works",
    features: [
      "Recurring subscription transactions",
      "Monthly payout visibility inside the tutor dashboard",
      "Subscriber management built into the platform",
    ],
  },
];

function PlanCard({ plan }: { plan: PricingCard }) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 border-[1.5px] ${
        plan.popular ? "border-primary shadow-primary" : "border-neutral-200"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">
          {plan.tier}
        </div>
        {plan.badge && <Badge variant="violet">{plan.badge}</Badge>}
      </div>

      <div className="flex items-end gap-1.5 mb-1">
        <span className="text-[2.5rem] font-extrabold text-neutral-900 tracking-tight leading-none">
          {plan.price}
        </span>
        {plan.unit && (
          <span className="text-sm text-neutral-500 pb-1.5">{plan.unit}</span>
        )}
      </div>

      <p className="text-[.8rem] text-neutral-500 mb-5">{plan.tagline}</p>

      <div className="mb-5">
        <Button variant={plan.ctaVariant} size="lg" className="w-full" href={plan.href}>
          {plan.cta}
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {plan.features.map((feature) => (
          <div key={feature} className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-success" strokeWidth={3} />
            </div>
            <span className="text-[.85rem]">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [tab, setTab] = useState<"learners" | "tutors">("learners");

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[620px] mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary border-[1.5px] border-primary-muted text-[.72rem] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-3.5">
            Pricing
          </div>
          <h1 className="text-[2.6rem] font-extrabold text-neutral-900 leading-tight tracking-tight">
            Subscription Pricing That Matches Each Tutor
          </h1>
          <p className="text-base text-neutral-500 leading-relaxed mt-3.5">
            Tutors set their own weekly, monthly, and yearly rates. Once subscribed,
            learners get unlimited access to that tutor&apos;s paid library.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-neutral-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setTab("learners")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === "learners"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              For Learners
            </button>
            <button
              onClick={() => setTab("tutors")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === "tutors"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              For Tutors
            </button>
          </div>
        </div>

        {tab === "learners" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {learnerPlans.map((plan) => (
              <PlanCard key={plan.tier} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[860px] mx-auto">
            {tutorPlans.map((plan) => (
              <PlanCard key={plan.tier} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
