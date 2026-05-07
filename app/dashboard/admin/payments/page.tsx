"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, Search, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AdminTutorPaymentConfig } from "@/lib/types";

function formatMoney(value?: string | null) {
  return `BWP ${Number(value || 0).toLocaleString("en-BW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminPaymentsPage() {
  const { tokens } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [configured, setConfigured] = useState<"all" | "configured" | "pending">("all");
  const [configs, setConfigs] = useState<AdminTutorPaymentConfig[]>([]);

  const load = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await adminApi.getTutorPaymentConfigs(tokens.access, {
        search: search || undefined,
        configured:
          configured === "all"
            ? undefined
            : configured === "configured"
            ? "true"
            : "false",
      });
      setConfigs(res.results ?? []);
    } catch {
      toast.error("Failed to load tutor payment configs.");
    } finally {
      setLoading(false);
    }
  }, [configured, search, tokens, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const configuredCount = configs.filter(
      (config) => config.payout_settings?.is_configured
    ).length;
    const activePricedTutors = configs.filter(
      (config) =>
        !!config.subscription_plan &&
        [config.subscription_plan.weekly_price, config.subscription_plan.monthly_price, config.subscription_plan.yearly_price].some(
          (value) => Number(value) > 0
        )
    ).length;
    const activeSubscribers = configs.reduce(
      (sum, config) => sum + config.active_subscribers,
      0
    );
    return { configuredCount, activePricedTutors, activeSubscribers };
  }, [configs]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Tutor Payment Configs
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Review tutor subscription pricing and payout setup from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-2">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-[1.35rem] font-extrabold tracking-tight">
            {stats.configuredCount}
          </div>
          <div className="text-[.75rem] text-neutral-500">Configured Payouts</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-2">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-[1.35rem] font-extrabold tracking-tight">
            {stats.activePricedTutors}
          </div>
          <div className="text-[.75rem] text-neutral-500">Tutors With Active Rates</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-[1.35rem] font-extrabold tracking-tight">
            {stats.activeSubscribers}
          </div>
          <div className="text-[.75rem] text-neutral-500">Active Subscribers</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tutor name or email..."
              className="w-full pl-10 pr-4 py-2.5 border-[1.5px] border-neutral-200 rounded-[12px] text-sm bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200/60"
            />
          </div>
          <select
            value={configured}
            onChange={(e) =>
              setConfigured(e.target.value as "all" | "configured" | "pending")
            }
            className="px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[12px] text-sm bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200/60"
          >
            <option value="all">All configs</option>
            <option value="configured">Configured only</option>
            <option value="pending">Needs setup</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-16 text-sm text-neutral-400">
            No tutor payment configs found.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {configs.map((config) => (
              <div key={config.id} className="p-5">
                <div className="flex flex-col xl:flex-row xl:items-start gap-4 xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[.98rem] font-bold text-neutral-900">
                        {config.tutor_name}
                      </h3>
                      <Badge variant={config.is_approved ? "green" : "amber"}>
                        {config.is_approved ? "approved" : "pending"}
                      </Badge>
                      <Badge
                        variant={
                          config.payout_settings?.is_configured ? "violet" : "neutral"
                        }
                      >
                        {config.payout_settings?.is_configured
                          ? "payout configured"
                          : "setup needed"}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">{config.email}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Joined {new Date(config.date_joined).toLocaleDateString("en-ZA")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 min-w-full xl:min-w-[360px] xl:max-w-[420px]">
                    {[
                      {
                        label: "Weekly",
                        value: config.subscription_plan?.weekly_price,
                      },
                      {
                        label: "Monthly",
                        value: config.subscription_plan?.monthly_price,
                      },
                      {
                        label: "Yearly",
                        value: config.subscription_plan?.yearly_price,
                      },
                    ].map((rate) => (
                      <div
                        key={rate.label}
                        className="rounded-xl border border-neutral-200 p-3 text-center"
                      >
                        <div className="text-[.7rem] uppercase tracking-[0.08em] text-neutral-400">
                          {rate.label}
                        </div>
                        <div className="text-sm font-bold text-neutral-900 mt-1">
                          {rate.value && Number(rate.value) > 0
                            ? formatMoney(rate.value)
                            : "Not set"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 mt-4">
                  <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4">
                    <div className="text-[.82rem] font-semibold text-neutral-800 mb-2">
                      Payout Destination
                    </div>
                    {!config.payout_settings ? (
                      <p className="text-sm text-neutral-400">
                        No payout settings saved yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-[.72rem] uppercase tracking-[0.08em] text-neutral-400">
                            Method
                          </div>
                          <div className="font-medium text-neutral-900 mt-1 capitalize">
                            {config.payout_settings.payout_method.replaceAll("_", " ")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[.72rem] uppercase tracking-[0.08em] text-neutral-400">
                            Account Holder
                          </div>
                          <div className="font-medium text-neutral-900 mt-1">
                            {config.payout_settings.account_holder_name || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[.72rem] uppercase tracking-[0.08em] text-neutral-400">
                            Bank / Provider
                          </div>
                          <div className="font-medium text-neutral-900 mt-1">
                            {config.payout_settings.bank_name ||
                              config.payout_settings.mobile_provider ||
                              "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[.72rem] uppercase tracking-[0.08em] text-neutral-400">
                            Destination
                          </div>
                          <div className="font-medium text-neutral-900 mt-1">
                            {config.payout_settings.account_number_masked ||
                              config.payout_settings.mobile_number_masked ||
                              config.payout_settings.paypal_email ||
                              "—"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-4">
                    <div className="text-[.82rem] font-semibold text-neutral-800 mb-2">
                      Subscriber Snapshot
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-500">
                      <span>Active subscribers</span>
                      <span className="font-semibold text-neutral-900">
                        {config.active_subscribers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-neutral-500 mt-2">
                      <span>Total subscriber records</span>
                      <span className="font-semibold text-neutral-900">
                        {config.total_subscribers}
                      </span>
                    </div>
                    {config.subscription_plan?.updated_at && (
                      <p className="text-xs text-neutral-400 mt-3">
                        Rates last updated{" "}
                        {new Date(config.subscription_plan.updated_at).toLocaleDateString("en-ZA")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
