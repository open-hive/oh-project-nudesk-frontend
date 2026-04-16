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

const studentPlans: PricingCard[] = [
  {
    tier: "Free",
    price: "P0",
    unit: "/month",
    tagline: "Forever free. No credit card.",
    cta: "Get Started Free",
    ctaVariant: "outline-v",
    href: "/auth/signup",
    features: [
      "Browse all content",
      "Purchase individual courses",
      "Progress dashboard",
    ],
  },
  {
    tier: "Plus",
    price: "P19",
    unit: "/month",
    tagline: "Billed monthly. Cancel anytime.",
    cta: "Start Free Trial",
    ctaVariant: "primary",
    href: "/auth/signup",
    popular: true,
    badge: "Most Popular",
    features: [
      "Unlimited 500+ courses",
      "All study guides",
      "5 live class credits/mo",
      "Downloadable certificates",
    ],
  },
  {
    tier: "Pro",
    price: "P39",
    unit: "/month",
    tagline: "For committed learners.",
    cta: "Get Pro Access",
    ctaVariant: "outline-v",
    href: "/auth/signup",
    features: [
      "Everything in Plus",
      "Unlimited live credits",
      "1-on-1 session discounts",
      "Dedicated support manager",
    ],
  },
];

const tutorPlans: PricingCard[] = [
  {
    tier: "Standard",
    price: "80%",
    tagline: "Revenue share. Free to join.",
    cta: "Apply as Tutor",
    ctaVariant: "outline-v",
    href: "/auth/signup",
    features: [
      "Unlimited courses",
      "Live classes",
      "Monthly payouts",
    ],
  },
  {
    tier: "Pro",
    price: "90%",
    tagline: "Revenue share + P29/mo.",
    cta: "Apply for Pro",
    ctaVariant: "primary",
    href: "/auth/signup",
    popular: true,
    badge: "Best Value",
    features: [
      "Featured placement",
      "Bi-weekly payouts",
      "Cohort programs",
      "Growth support team",
    ],
  },
];

function PlanCard({ plan }: { plan: PricingCard }) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 border-[1.5px] ${
        plan.popular
          ? "border-primary shadow-primary"
          : "border-neutral-200"
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
        {plan.features.map((f) => (
          <div key={f} className="flex gap-2 items-center">
            <div className="w-4 h-4 rounded-full bg-success/10 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-success" strokeWidth={3} />
            </div>
            <span className="text-[.85rem]">{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [tab, setTab] = useState<"students" | "tutors">("students");

  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[520px] mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary border-[1.5px] border-primary-muted text-[.72rem] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-3.5">
            Pricing
          </div>
          <h1 className="text-[2.6rem] font-extrabold text-neutral-900 leading-tight tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base text-neutral-500 leading-relaxed mt-3.5">
            One plan whether you&apos;re learning or earning.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-neutral-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setTab("students")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === "students"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              For Students
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

        {tab === "students" ? (
          <div className="grid grid-cols-3 gap-4 max-w-[880px] mx-auto">
            {studentPlans.map((plan) => (
              <PlanCard key={plan.tier} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-[600px] mx-auto">
            {tutorPlans.map((plan) => (
              <PlanCard key={plan.tier} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
