"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2, Receipt, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { tutorApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { SubscriptionPlan, TutorPayoutSettings, TutorSubscription } from "@/lib/types";

function normalizeSubscriptions(
  data: TutorSubscription[] | { results?: TutorSubscription[] }
) {
  return Array.isArray(data) ? data : data.results ?? [];
}

function formatMoney(value: string) {
  return `BWP ${Number(value || 0).toLocaleString("en-BW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toMoney(value: number) {
  return value.toFixed(2);
}

const MOBILE_MONEY_PROVIDERS = ["Mascom", "Orange", "BTC"] as const;

export default function TutorPaymentsPage() {
  const { tokens } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [subscribers, setSubscribers] = useState<TutorSubscription[]>([]);
  const [payoutSettings, setPayoutSettings] = useState<TutorPayoutSettings | null>(null);

  const [weeklyPrice, setWeeklyPrice] = useState("0.00");
  const [monthlyPrice, setMonthlyPrice] = useState("0.00");
  const [yearlyPrice, setYearlyPrice] = useState("0.00");
  const [autoFillRates, setAutoFillRates] = useState(true);
  const [lastEditedRate, setLastEditedRate] = useState<"weekly" | "monthly" | "yearly">("monthly");

  const [payoutMethod, setPayoutMethod] = useState<TutorPayoutSettings["payout_method"]>("bank_transfer");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [mobileProvider, setMobileProvider] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  function applyDerivedRates(source: "weekly" | "monthly" | "yearly", rawValue: string) {
    if (source === "weekly") setWeeklyPrice(rawValue);
    if (source === "monthly") setMonthlyPrice(rawValue);
    if (source === "yearly") setYearlyPrice(rawValue);

    if (rawValue === "") return;

    const amount = Number(rawValue);
    if (!Number.isFinite(amount) || amount < 0) return;

    if (source === "weekly") {
      const yearly = amount * 52;
      setMonthlyPrice(toMoney(yearly / 12));
      setYearlyPrice(toMoney(yearly));
      return;
    }

    if (source === "monthly") {
      const yearly = amount * 12;
      setWeeklyPrice(toMoney(yearly / 52));
      setYearlyPrice(toMoney(yearly));
      return;
    }

    const monthly = amount / 12;
    setWeeklyPrice(toMoney(amount / 52));
    setMonthlyPrice(toMoney(monthly));
  }

  function setRateValue(source: "weekly" | "monthly" | "yearly", rawValue: string) {
    if (source === "weekly") setWeeklyPrice(rawValue);
    if (source === "monthly") setMonthlyPrice(rawValue);
    if (source === "yearly") setYearlyPrice(rawValue);
  }

  function handleRateChange(source: "weekly" | "monthly" | "yearly", rawValue: string) {
    setLastEditedRate(source);
    if (autoFillRates) {
      applyDerivedRates(source, rawValue);
      return;
    }
    setRateValue(source, rawValue);
  }

  function handleAutoFillToggle() {
    const next = !autoFillRates;
    setAutoFillRates(next);

    if (!next) return;

    const sourceValue =
      lastEditedRate === "weekly"
        ? weeklyPrice
        : lastEditedRate === "yearly"
        ? yearlyPrice
        : monthlyPrice;

    if (sourceValue === "") return;
    applyDerivedRates(lastEditedRate, sourceValue);
  }

  const load = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const [planData, subscriberData, payoutData] = await Promise.all([
        tutorApi.getSubscriptionPlan(tokens.access),
        tutorApi.getSubscribers(tokens.access),
        tutorApi.getPayoutSettings(tokens.access),
      ]);

      setPlan(planData);
      setWeeklyPrice(planData.weekly_price);
      setMonthlyPrice(planData.monthly_price);
      setYearlyPrice(planData.yearly_price);
      setSubscribers(normalizeSubscriptions(subscriberData));

      setPayoutSettings(payoutData);
      setPayoutMethod(payoutData.payout_method);
      setBankName(payoutData.bank_name);
      setAccountNumber(payoutData.account_number ?? "");
      setAccountHolderName(payoutData.account_holder_name);
      setBranchCode(payoutData.branch_code);
      setMobileProvider(payoutData.mobile_provider);
      setMobileNumber(payoutData.mobile_number ?? "");
      setPaypalEmail(payoutData.paypal_email);
    } catch {
      toast.error("Failed to load payment configuration.");
    } finally {
      setLoading(false);
    }
  }, [tokens, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!tokens) return;
    setSavingPlan(true);
    try {
      const updated = await tutorApi.updateSubscriptionPlan(tokens.access, {
        weekly_price: weeklyPrice,
        monthly_price: monthlyPrice,
        yearly_price: yearlyPrice,
      });
      setPlan(updated);
      setWeeklyPrice(updated.weekly_price);
      setMonthlyPrice(updated.monthly_price);
      setYearlyPrice(updated.yearly_price);
      toast.success("Subscription pricing updated.");
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.body.detail ?? Object.values(err.body).flat().join(", ");
        toast.error(typeof detail === "string" ? detail : "Failed to save rates.");
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleSavePayout(e: React.FormEvent) {
    e.preventDefault();
    if (!tokens) return;
    setSavingPayout(true);
    try {
      const updated = await tutorApi.updatePayoutSettings(tokens.access, {
        payout_method: payoutMethod,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        branch_code: branchCode,
        mobile_provider: mobileProvider,
        mobile_number: mobileNumber,
        paypal_email: paypalEmail,
      });
      setPayoutSettings(updated);
      toast.success("Payout settings updated.");
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.body.detail ?? Object.values(err.body).flat().join(", ");
        toast.error(
          typeof detail === "string" ? detail : "Failed to update payout settings."
        );
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSavingPayout(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeSubscribers = subscribers.filter((item) => item.is_currently_active).length;
  const inputCls =
    "w-full h-10 px-3 text-[.875rem] border-[1.5px] border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10";
  const labelCls =
    "block text-[.72rem] font-bold uppercase tracking-[0.07em] text-neutral-500 mb-1.5";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">Payments</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Centralize your tutor subscription pricing and payout destination here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-[1.35rem] font-extrabold tracking-tight">{activeSubscribers}</div>
          <div className="text-[.75rem] text-neutral-500">Active Subscribers</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-2">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-[1.35rem] font-extrabold tracking-tight">{formatMoney(monthlyPrice)}</div>
          <div className="text-[.75rem] text-neutral-500">Current Monthly Rate</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-2">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="text-[1.35rem] font-extrabold tracking-tight">
            {payoutSettings?.is_configured ? "Configured" : "Setup Needed"}
          </div>
          <div className="text-[.75rem] text-neutral-500">Payout Destination</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSavePlan} className="bg-white rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <div className="text-[.9rem] font-bold">Subscription Pricing</div>
                <p className="text-xs text-neutral-500 mt-1">
                  Paid courses, study guides, and live sessions all inherit access from these tutor rates.
                </p>
              </div>
              {plan?.updated_at && (
                <Badge variant="violet">
                  Updated {new Date(plan.updated_at).toLocaleDateString("en-ZA")}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Weekly</label>
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  step="0.01"
                  value={weeklyPrice}
                  onChange={(e) => handleRateChange("weekly", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Monthly</label>
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlyPrice}
                  onChange={(e) => handleRateChange("monthly", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Yearly</label>
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  step="0.01"
                  value={yearlyPrice}
                  onChange={(e) => handleRateChange("yearly", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-bold text-neutral-900">
                    Auto-calculate rates
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    Rates auto-calculate from the last field you edit, and you
                    can still override any amount before saving by toggling the
                    Auto-Calculate button.
                  </p>
                </div>
                <div className="inline-flex items-center gap-3 rounded-full border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800">
                  <span>Auto-calculate</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoFillRates}
                    aria-label="Toggle rate auto-calculation"
                    onClick={handleAutoFillToggle}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      autoFillRates ? "bg-violet-600" : "bg-neutral-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        autoFillRates ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-neutral-600">
              Set individual content items as `free` or `subscriber-only` when creating them. The actual paid amount is managed only here.
            </div>

            <div className="mt-4">
              <Button type="submit" variant="primary" loading={savingPlan}>
                Save Pricing
              </Button>
            </div>
          </form>

          <form onSubmit={handleSavePayout} className="bg-white rounded-2xl border border-neutral-200 p-5">
            <div className="text-[.9rem] font-bold mb-5">Payout Configuration</div>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className={labelCls}>Payout Method</label>
                <select
                  className={inputCls}
                  value={payoutMethod}
                  onChange={(e) =>
                    setPayoutMethod(e.target.value as TutorPayoutSettings["payout_method"])
                  }
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              {payoutMethod === "bank_transfer" && (
                <>
                  <div>
                    <label className={labelCls}>Bank Name</label>
                    <input className={inputCls} value={bankName} onChange={(e) => setBankName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Account Holder</label>
                    <input className={inputCls} value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Account Number</label>
                      <input className={inputCls} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Branch Code</label>
                      <input className={inputCls} value={branchCode} onChange={(e) => setBranchCode(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {payoutMethod === "mobile_money" && (
                <>
                  <div>
                    <label className={labelCls}>Provider</label>
                    <select
                      className={inputCls}
                      value={mobileProvider}
                      onChange={(e) => setMobileProvider(e.target.value)}
                    >
                      <option value="">Select a provider</option>
                      {MOBILE_MONEY_PROVIDERS.map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Mobile Number</label>
                    <input className={inputCls} value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                  </div>
                </>
              )}

              {payoutMethod === "paypal" && (
                <div>
                  <label className={labelCls}>PayPal Email</label>
                  <input className={inputCls} type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
                </div>
              )}

              <Button type="submit" variant="secondary" loading={savingPayout}>
                Save Payout Settings
              </Button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <div className="text-[.9rem] font-bold mb-3">Rate Snapshot</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Weekly", value: weeklyPrice },
                { label: "Monthly", value: monthlyPrice },
                { label: "Yearly", value: yearlyPrice },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-neutral-200 p-3 text-center">
                  <div className="text-[.7rem] uppercase tracking-[0.08em] text-neutral-400">{item.label}</div>
                  <div className="text-sm font-bold text-neutral-900 mt-1">
                    {formatMoney(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            <div className="text-[.9rem] font-bold mb-3">Recent Subscribers</div>
            {subscribers.length === 0 ? (
              <p className="text-[.82rem] text-neutral-400">
                No subscribers yet. Once parents or students subscribe, they will show here.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {subscribers.slice(0, 6).map((subscriber) => (
                  <div key={subscriber.reference} className="rounded-xl border border-neutral-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[.82rem] font-semibold text-neutral-900 truncate">
                          {subscriber.student_name}
                        </div>
                        <div className="text-[.74rem] text-neutral-500 truncate">
                          {subscriber.student_email}
                        </div>
                      </div>
                      <Badge variant={subscriber.is_currently_active ? "green" : "neutral"}>
                        {subscriber.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[.74rem] text-neutral-500">
                      <span className="capitalize">{subscriber.billing_cycle}</span>
                      <span>{formatMoney(subscriber.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
