"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalHead, ModalBody, ModalFoot } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Check, Copy, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { paymentApi, parentApi, ApiError } from "@/lib/api";
import type { CheckoutResponse, ChildSummary, SubscriptionPlan } from "@/lib/types";

type PaymentMethod = "btc" | "orange_money" | "my_zaka" | "visa";
type BillingCycle = "weekly" | "monthly" | "yearly";
type Step = "plan" | "details" | "processing" | "done" | "error";

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: CheckoutResponse) => void | Promise<void>;
  tutorId: number;
  tutorName: string;
  title: string;
  plan: SubscriptionPlan | null;
  childId?: number;
  childOptions?: ChildSummary[];
  beneficiaryLabel?: string;
  returnTo?: string;
}

const METHODS: {
  id: PaymentMethod;
  label: string;
  sub: string;
  bg: string;
  ring: string;
  text: string;
  badge: string;
}[] = [
  {
    id: "btc",
    label: "Bitcoin",
    sub: "BTC / Crypto",
    bg: "bg-amber-50 hover:bg-amber-100",
    ring: "border-amber-200 data-[selected=true]:border-amber-500 data-[selected=true]:ring-2 data-[selected=true]:ring-amber-300/40",
    text: "text-amber-600",
    badge: "₿",
  },
  {
    id: "orange_money",
    label: "Orange Money",
    sub: "Mobile Money",
    bg: "bg-orange-50 hover:bg-orange-100",
    ring: "border-orange-200 data-[selected=true]:border-orange-500 data-[selected=true]:ring-2 data-[selected=true]:ring-orange-300/40",
    text: "text-orange-500",
    badge: "OM",
  },
  {
    id: "my_zaka",
    label: "My Zaka",
    sub: "Mobile Wallet",
    bg: "bg-emerald-50 hover:bg-emerald-100",
    ring: "border-emerald-200 data-[selected=true]:border-emerald-500 data-[selected=true]:ring-2 data-[selected=true]:ring-emerald-300/40",
    text: "text-emerald-600",
    badge: "MZ",
  },
  {
    id: "visa",
    label: "Visa / Card",
    sub: "Credit & Debit",
    bg: "bg-blue-50 hover:bg-blue-100",
    ring: "border-blue-200 data-[selected=true]:border-blue-500 data-[selected=true]:ring-2 data-[selected=true]:ring-blue-300/40",
    text: "text-blue-700",
    badge: "VISA",
  },
];

const FAKE_BTC_ADDRESS = "bc1q4xy6lp6j7k8m9nudesk0abc123k9z3xfake";
const PROCESSING_LABELS = [
  "Connecting to gateway…",
  "Verifying subscription…",
  "Confirming payment…",
  "Activating access…",
];

function fmtPrice(value: string) {
  const amount = Number(value || 0);
  return `P${amount.toLocaleString("en-BW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function cycleLabel(cycle: BillingCycle) {
  if (cycle === "weekly") return "Weekly";
  if (cycle === "monthly") return "Monthly";
  return "Yearly";
}

export function PaymentModal({
  open,
  onClose,
  onSuccess,
  tutorId,
  tutorName,
  title,
  plan,
  childId,
  childOptions,
  beneficiaryLabel,
  returnTo,
}: PaymentModalProps) {
  const router = useRouter();
  const { user, tokens } = useAuth();

  const availablePlans = useMemo(
    () =>
      ([
        { cycle: "weekly" as const, price: plan?.weekly_price ?? "0.00" },
        { cycle: "monthly" as const, price: plan?.monthly_price ?? "0.00" },
        { cycle: "yearly" as const, price: plan?.yearly_price ?? "0.00" },
      ]).filter((item) => Number(item.price) > 0),
    [plan]
  );

  const [step, setStep] = useState<Step>("plan");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle | null>(
    availablePlans[0]?.cycle ?? null
  );
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [zakaAccount, setZakaAccount] = useState("");
  const [zakaPin, setZakaPin] = useState("");
  const [availableChildren, setAvailableChildren] = useState<ChildSummary[]>(
    childOptions ?? []
  );
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(childId ?? null);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("plan");
        setMethod(null);
        setBillingCycle(availablePlans[0]?.cycle ?? null);
        setProgress(0);
        setError("");
        setCopied(false);
        setCheckoutResult(null);
        setCardName("");
        setCardNumber("");
        setExpiry("");
        setCvv("");
        setPhone("");
        setPin("");
        setZakaAccount("");
        setZakaPin("");
        setAvailableChildren(childOptions ?? []);
        setLoadingChildren(false);
        setSelectedChildId(childId ?? null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [availablePlans, childId, childOptions, open]);

  useEffect(() => {
    if (!open || user?.role !== "parent" || childId != null || !tokens?.access) return;
    if (childOptions && childOptions.length > 0) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (cancelled) return;
        setAvailableChildren(childOptions);
        setSelectedChildId((current) => current ?? childOptions[0]?.child_id ?? null);
      });
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingChildren(true);
      try {
        const children = await parentApi.getChildren(tokens.access);
        if (cancelled) return;
        setAvailableChildren(children);
        setSelectedChildId((current) => current ?? children[0]?.child_id ?? null);
      } catch {
        if (cancelled) return;
        setAvailableChildren([]);
      } finally {
        if (!cancelled) setLoadingChildren(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [childId, childOptions, open, tokens?.access, user?.role]);

  const selectedPlan = availablePlans.find((item) => item.cycle === billingCycle) ?? null;
  const selected = METHODS.find((m) => m.id === method);
  const selectedChild =
    availableChildren.find((item) => item.child_id === (childId ?? selectedChildId)) ?? null;
  const resolvedChildId = childId ?? selectedChildId;
  const isParentCheckout = user?.role === "parent";
  const isStudentCheckout = user?.role === "student";
  const isParentManagedStudent =
    isStudentCheckout &&
    !!user?.is_parent_managed_child &&
    !user?.can_self_subscribe;
  const returnPath = returnTo ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const audienceSubtitle =
    beneficiaryLabel
      ? `${beneficiaryLabel} → ${tutorName}`
      : isParentCheckout
      ? selectedChild
        ? `${selectedChild.first_name} ${selectedChild.last_name} → ${tutorName}`
        : `Parent checkout → ${tutorName}`
      : isStudentCheckout
      ? `Student / Child account → ${tutorName}`
      : tutorName;
  const processingLabel =
    PROCESSING_LABELS[
      Math.min(
        PROCESSING_LABELS.length - 1,
        Math.floor((progress / 100) * PROCESSING_LABELS.length)
      )
    ];
  const circumference = 2 * Math.PI * 34;

  async function handlePay() {
    if (!tokens?.access || !billingCycle) return;
    setStep("processing");
    setProgress(0);
    setError("");

    const start = Date.now();
    const duration = 2400;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(85, (elapsed / duration) * 85);
      setProgress(pct);
      if (elapsed < duration) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    await new Promise((r) => setTimeout(r, 2500));
    setProgress(94);

    try {
      const result = await paymentApi.checkout(tokens.access, {
        tutor_id: tutorId,
        billing_cycle: billingCycle,
        ...(resolvedChildId != null ? { child_id: resolvedChildId } : {}),
      });
      setCheckoutResult(result);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 350));
      setStep("done");
    } catch (e) {
      setError(
        e instanceof ApiError
          ? String((e.body as Record<string, string>).detail ?? "Subscription failed.")
          : "Subscription failed. Please try again."
      );
      setStep("error");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(FAKE_BTC_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleDone() {
    if (checkoutResult) {
      await onSuccess(checkoutResult);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={step === "processing" ? () => {} : onClose} size="sm">
      {step === "plan" && (
        <>
          <ModalHead
            title="Choose a Subscription"
            subtitle={audienceSubtitle}
            onClose={onClose}
          />
          <ModalBody>
            {!user ? (
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  Choose who is paying before continuing to checkout.
                </div>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/auth/signin?role=child&next=${encodeURIComponent(returnPath)}`
                    )
                  }
                  className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left transition-all hover:border-violet-400"
                >
                  <div className="text-sm font-bold text-violet-900">Student / Child</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Subscribe for your own learner account and unlock this tutor&apos;s paid library.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/auth/signin?role=parent&next=${encodeURIComponent(returnPath)}`
                    )
                  }
                  className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-left transition-all hover:border-orange-400"
                >
                  <div className="text-sm font-bold text-orange-900">Parent</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Pay now, then assign the tutor subscription to a linked child from the parent dashboard.
                  </div>
                </button>
              </div>
            ) : !isParentCheckout && !isStudentCheckout ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                Only parent and student accounts can start a subscription checkout.
              </div>
            ) : isParentManagedStudent ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-neutral-700">
                Tutor subscriptions for this learner are managed by a linked parent or guardian. Ask them to subscribe from the parent dashboard if you still need access.
              </div>
            ) : !plan || availablePlans.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                This tutor has not published subscription pricing yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.08em] text-neutral-500">
                    Paying as
                  </div>
                  <div className="mt-1 text-sm font-semibold text-neutral-900">
                    {isParentCheckout
                      ? selectedChild
                        ? `${selectedChild.first_name} ${selectedChild.last_name}`
                        : "Parent checkout"
                      : "Student / Child account"}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {isParentCheckout
                      ? resolvedChildId != null
                        ? "The subscription will be attached to the selected child."
                        : "You can subscribe now and assign this tutor subscription to a child later."
                      : "This subscription will unlock your learner account instantly."}
                  </p>
                </div>

                {isParentCheckout && childId == null && (
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <label className="block text-xs font-bold uppercase tracking-[0.08em] text-orange-700 mb-2">
                      Child beneficiary
                    </label>
                    {loadingChildren ? (
                      <div className="text-sm text-neutral-500">Loading linked children…</div>
                    ) : availableChildren.length === 0 ? (
                      <div className="text-sm text-neutral-600">
                        No linked children found yet. You can still continue and assign this subscription later.
                      </div>
                    ) : (
                      <select
                        className="w-full rounded-xl border-[1.5px] border-orange-200 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
                        value={resolvedChildId ?? ""}
                        onChange={(e) => setSelectedChildId(Number(e.target.value))}
                      >
                        {availableChildren.map((child) => (
                          <option key={child.child_id} value={child.child_id}>
                            {child.first_name} {child.last_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.08em] text-violet-700">
                    Access
                  </div>
                  <div className="mt-1 text-sm font-semibold text-neutral-900">
                    {title}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    One subscription unlocks all paid content from {tutorName}.
                  </p>
                </div>

                {availablePlans.map((item) => {
                  const active = billingCycle === item.cycle;
                  return (
                    <button
                      key={item.cycle}
                      type="button"
                      onClick={() => setBillingCycle(item.cycle)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-violet-500 bg-violet-50 shadow-sm"
                          : "border-neutral-200 bg-white hover:border-violet-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-neutral-900">
                            {cycleLabel(item.cycle)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            Cancel anytime. Access stays active through the paid period.
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-extrabold text-violet-700">
                            {fmtPrice(item.price)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            /{item.cycle === "yearly" ? "year" : item.cycle === "monthly" ? "month" : "week"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ModalBody>
          <ModalFoot>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {user && (isParentCheckout || isStudentCheckout) && (
              <Button
                variant="primary"
                size="sm"
                disabled={
                  isParentManagedStudent ||
                  !selectedPlan ||
                  false
                }
                onClick={() => setStep("details")}
              >
                Continue
              </Button>
            )}
          </ModalFoot>
        </>
      )}

      {step === "details" && selectedPlan && (
        <>
          <ModalHead
            title="Choose Payment Method"
            subtitle={`${cycleLabel(selectedPlan.cycle)} · ${fmtPrice(selectedPlan.price)}`}
            onClose={onClose}
          />
          <ModalBody>
            {!method ? (
              <div className="grid grid-cols-2 gap-3">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all ${m.bg} ${m.ring}`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white text-[.9rem] font-extrabold ${m.text} border-current`}>
                      {m.badge}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-bold ${m.text}`}>{m.label}</div>
                      <div className="mt-0.5 text-[.7rem] text-neutral-400">{m.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-[.8rem] text-neutral-700">
                  <strong>{cycleLabel(selectedPlan.cycle)} subscription</strong> for{" "}
                  <strong>{tutorName}</strong> — <strong>{fmtPrice(selectedPlan.price)}</strong>
                </div>

                {method === "btc" && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="mb-3 text-[.82rem] text-neutral-700">
                        Send <span className="font-bold text-amber-700">{fmtPrice(selectedPlan.price)} worth of BTC</span> to the address below:
                      </p>
                      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2.5">
                        <code className="flex-1 break-all select-all text-[.72rem] text-neutral-700">
                          {FAKE_BTC_ADDRESS}
                        </code>
                        <button
                          onClick={handleCopy}
                          className="shrink-0 text-amber-600 hover:text-amber-700"
                          title="Copy address"
                        >
                          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-center text-[.8rem] text-neutral-500">
                      Once you&apos;ve sent the payment, click below to confirm.
                    </p>
                  </div>
                )}

                {method === "orange_money" && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-600">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full rounded-xl border-[1.5px] border-neutral-200 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/10"
                        placeholder="07XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={12}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-600">PIN</label>
                      <input
                        type="password"
                        className="w-full rounded-xl border-[1.5px] border-neutral-200 px-3 py-2.5 text-sm tracking-[0.25em] focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/10"
                        placeholder="••••"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                      />
                    </div>
                  </div>
                )}

                {method === "my_zaka" && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-600">Account Number</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border-[1.5px] border-neutral-200 px-3 py-2.5 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                        placeholder="ZK-XXXXXXXXX"
                        value={zakaAccount}
                        onChange={(e) => setZakaAccount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-600">PIN</label>
                      <input
                        type="password"
                        className="w-full rounded-xl border-[1.5px] border-neutral-200 px-3 py-2.5 text-sm tracking-[0.25em] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                        placeholder="••••••"
                        value={zakaPin}
                        onChange={(e) => setZakaPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                      />
                    </div>
                  </div>
                )}

                {method === "visa" && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-600">Cardholder Name</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border-[1.5px] border-neutral-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-600">Card Number</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border-[1.5px] border-neutral-200 px-3 py-2.5 text-sm font-mono tracking-widest focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCardNumber(raw.match(/.{1,4}/g)?.join(" ") ?? raw);
                        }}
                        maxLength={19}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-semibold text-neutral-600">Expiry</label>
                        <input
                          type="text"
                          className="w-full rounded-xl border-[1.5px] border-neutral-200 px-3 py-2.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                          placeholder="MM / YY"
                          value={expiry}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setExpiry(raw.length > 2 ? `${raw.slice(0, 2)} / ${raw.slice(2)}` : raw);
                          }}
                          maxLength={7}
                        />
                      </div>
                      <div className="w-24">
                        <label className="mb-1 block text-xs font-semibold text-neutral-600">CVV</label>
                        <input
                          type="password"
                          className="w-full rounded-xl border-[1.5px] border-neutral-200 px-3 py-2.5 text-sm tracking-widest focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                          placeholder="•••"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFoot>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (method) {
                  setMethod(null);
                  return;
                }
                setStep("plan");
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!method}
              onClick={handlePay}
            >
              {!method ? "Choose a method" : method === "btc" ? "I've Sent the Payment" : `Pay ${fmtPrice(selectedPlan.price)}`}
            </Button>
          </ModalFoot>
        </>
      )}

      {step === "processing" && (
        <>
          <ModalHead title="Processing Payment" subtitle="Please don't close this window…" onClose={() => {}} />
          <ModalBody>
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="relative h-[88px] w-[88px]">
                <svg className="h-[88px] w-[88px] -rotate-90" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle
                    cx="44"
                    cy="44"
                    r="34"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress / 100)}
                    style={{ transition: "stroke-dashoffset 0.35s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-extrabold text-violet-700">{Math.round(progress)}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-neutral-800">{processingLabel}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {selected?.label} · {billingCycle ? cycleLabel(billingCycle) : ""} subscription
                </p>
              </div>
            </div>
          </ModalBody>
        </>
      )}

      {step === "done" && checkoutResult && selectedPlan && (
        <>
          <ModalHead
            title="Subscription Confirmed"
            subtitle={title}
            onClose={handleDone}
          />
          <ModalBody>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-200 bg-green-100">
                <Check className="h-8 w-8 text-green-600" strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-neutral-800">
                  Your subscription is active
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {cycleLabel(selectedPlan.cycle)} · {fmtPrice(selectedPlan.price)} · {tutorName}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFoot>
            <Button variant="primary" size="sm" className="w-full" onClick={handleDone}>
              Continue
            </Button>
          </ModalFoot>
        </>
      )}

      {step === "error" && (
        <>
          <ModalHead title="Payment Failed" onClose={onClose} />
          <ModalBody>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-200 bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-center text-sm text-neutral-700">{error}</p>
            </div>
          </ModalBody>
          <ModalFoot>
            <Button variant="secondary" size="sm" onClick={() => setStep("details")}>
              Try Again
            </Button>
            <Button variant="danger-ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </ModalFoot>
        </>
      )}
    </Modal>
  );
}
