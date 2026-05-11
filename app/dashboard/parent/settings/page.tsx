"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, parentApi, paymentApi, ApiError } from "@/lib/api";
import type { ParentPreference, Profile, TutorSubscription } from "@/lib/types";

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

export default function ParentSettingsPage() {
  const { user, tokens, fetchProfile } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [preferences, setPreferences] = useState<ParentPreference | null>(null);
  const [subscriptions, setSubscriptions] = useState<TutorSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [cancellingReference, setCancellingReference] = useState<string | null>(
    null
  );

  const [notifications, setNotifications] = useState({
    childActivity: true,
    paymentReceipts: true,
    newCourses: false,
    weeklyReport: true,
  });

  const loadProfile = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const p = await apiFetch<Profile>("/users/profile/setup/", {
        token: tokens.access,
      });
      const preferenceData = await parentApi.getPreferences(tokens.access);
      setFirstName(p.first_name);
      setLastName(p.last_name);
      setBio(p.bio || "");
      setPhone(p.phone || "");
      setPreferences(preferenceData);
    } catch {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [tokens, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  const loadSubscriptions = useCallback(async () => {
    if (!tokens) {
      setSubscriptions([]);
      setSubscriptionsLoading(false);
      return;
    }

    setSubscriptionsLoading(true);
    try {
      const response = await paymentApi.getMySubscriptions(tokens.access);
      setSubscriptions(normalizeSubscriptions(response));
    } catch {
      toast.error("Failed to load subscriptions.");
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [tokens, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubscriptions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSubscriptions]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tokens) return;
    setSaving(true);
    try {
      await apiFetch<Profile>("/users/profile/setup/", {
        method: "PATCH",
        token: tokens.access,
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          bio,
          phone,
        }),
      });
      await fetchProfile();
      if (preferences) {
        const updatedPreferences = await parentApi.updatePreferences(tokens.access, preferences);
        setPreferences(updatedPreferences);
      }
      toast.success("Profile updated.");
    } catch (err) {
      if (err instanceof ApiError) {
        const detail =
          err.body.detail ?? Object.values(err.body).flat().join(", ");
        toast.error(typeof detail === "string" ? detail : "Failed to save.");
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSubscription(reference: string) {
    if (!tokens) return;

    const subscription = subscriptions.find((item) => item.reference === reference);
    if (!subscription) return;

    const confirmCancel = window.confirm(
      `Cancel ${subscription.tutor_name}'s subscription${
        subscription.is_assigned ? ` for ${subscription.student_name}` : ""
      }? Access will stay active until ${new Date(
        subscription.current_period_end
      ).toLocaleDateString("en-ZA")}.`
    );

    if (!confirmCancel) return;

    setCancellingReference(reference);
    try {
      const response = await paymentApi.cancelSubscription(tokens.access, reference);
      setSubscriptions((prev) =>
        prev.map((item) =>
          item.reference === reference ? response.subscription : item
        )
      );
      toast.success(response.detail);
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.body.detail;
        toast.error(
          typeof detail === "string" ? detail : "Failed to cancel subscription."
        );
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setCancellingReference(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const autoAssign = preferences?.auto_assign_single_child ?? true;
  const allowChildSelfSubscription =
    preferences?.allow_child_self_subscription ?? false;
  const defaultLearningAssignee = preferences?.default_learning_assignee ?? "child";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Account Settings
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Left column */}
        <div className="flex flex-col gap-3.5">
          {/* Profile form */}
          <form
            onSubmit={handleSave}
            className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-6"
          >
            <div className="text-[.9rem] font-bold mb-5">
              Profile Information
            </div>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[.8rem] font-semibold text-neutral-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[.8rem] font-semibold text-neutral-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[.8rem] font-semibold text-neutral-700 mb-1.5">
                  Email
                </label>
                <input
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
                  value={user?.email ?? ""}
                  disabled
                />
              </div>
              <div>
                <label className="block text-[.8rem] font-semibold text-neutral-700 mb-1.5">
                  Phone
                </label>
                <input
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+27 XXX XXX XXXX"
                />
              </div>
              <div>
                <label className="block text-[.8rem] font-semibold text-neutral-700 mb-1.5">
                  Bio
                </label>
                <textarea
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y min-h-[88px] leading-[1.6]"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <Button type="submit" variant="primary" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </div>
          </form>

          <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-6">
            <div className="text-[.9rem] font-bold mb-5">Access & Learning Setup</div>
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[.85rem] font-semibold text-neutral-900">
                    Auto-assign the current course for a single child
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    If you only have one linked child, the app can automatically assign the course you were viewing right after a tutor subscription is paid.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoAssign}
                  onClick={() =>
                    setPreferences((prev) => ({
                      auto_assign_single_child: !(prev?.auto_assign_single_child ?? true),
                      allow_child_self_subscription:
                        prev?.allow_child_self_subscription ?? false,
                      default_learning_assignee:
                        prev?.default_learning_assignee ?? "child",
                      updated_at: prev?.updated_at ?? "",
                    }))
                  }
                  className={`relative mt-1 h-6 w-11 rounded-full transition-colors ${
                    autoAssign ? "bg-primary" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      autoAssign ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[.85rem] font-semibold text-neutral-900">
                    Let linked children buy subscriptions themselves
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    Keep this off if you want all tutor discovery and subscription decisions to stay on the parent dashboard. Turn it on only when a child should manage their own tutor subscriptions.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowChildSelfSubscription}
                  onClick={() =>
                    setPreferences((prev) => ({
                      auto_assign_single_child: prev?.auto_assign_single_child ?? true,
                      allow_child_self_subscription:
                        !(prev?.allow_child_self_subscription ?? false),
                      default_learning_assignee:
                        prev?.default_learning_assignee ?? "child",
                      updated_at: prev?.updated_at ?? "",
                    }))
                  }
                  className={`relative mt-1 h-6 w-11 rounded-full transition-colors ${
                    allowChildSelfSubscription ? "bg-primary" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      allowChildSelfSubscription ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-[.8rem] font-semibold text-neutral-700 mb-1.5">
                  Default learning-plan owner
                </label>
                <select
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={defaultLearningAssignee}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      auto_assign_single_child: prev?.auto_assign_single_child ?? true,
                      allow_child_self_subscription:
                        prev?.allow_child_self_subscription ?? false,
                      default_learning_assignee: e.target.value as "child" | "self",
                      updated_at: prev?.updated_at ?? "",
                    }))
                  }
                >
                  <option value="child">Linked child</option>
                  <option value="self">Parent self</option>
                </select>
                <p className="text-sm text-neutral-500 mt-1.5">
                  This affects new learning-path items. Use <strong>Parent self</strong> if you want to keep material in your own planning queue before assigning it to a child.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <div className="text-[.9rem] font-bold">Tutor Subscriptions</div>
                <p className="text-sm text-neutral-500 mt-1">
                  Cancel subscriptions here, whether they are already assigned to a
                  child or still waiting to be assigned.
                </p>
              </div>
              <Badge variant="violet">{subscriptions.length}</Badge>
            </div>

            {subscriptionsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-neutral-400">
                <CreditCard className="w-7 h-7" />
                <p className="text-[.82rem]">
                  No tutor subscriptions to manage yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {subscriptions.map((subscription) => {
                  const isActive =
                    subscription.status === "active" &&
                    subscription.is_currently_active;
                  const isCancelled = subscription.status === "cancelled";

                  return (
                    <div
                      key={subscription.reference}
                      className="rounded-2xl border border-neutral-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-900 truncate">
                            {subscription.tutor_name}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1 truncate">
                            {subscription.is_assigned
                              ? `For ${subscription.student_name}`
                              : "Not assigned to a child yet"}
                          </div>
                        </div>
                        <Badge
                          variant={
                            isActive
                              ? "green"
                              : isCancelled
                              ? "amber"
                              : "neutral"
                          }
                        >
                          {isActive
                            ? "Active"
                            : isCancelled
                            ? "Cancelled"
                            : "Expired"}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                          <div className="text-[.68rem] font-bold uppercase tracking-[0.08em] text-neutral-400">
                            Billing
                          </div>
                          <div className="mt-1 font-semibold text-neutral-900 capitalize">
                            {subscription.billing_cycle}
                          </div>
                        </div>
                        <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                          <div className="text-[.68rem] font-bold uppercase tracking-[0.08em] text-neutral-400">
                            Amount
                          </div>
                          <div className="mt-1 font-semibold text-neutral-900">
                            {formatMoney(subscription.amount)}
                          </div>
                        </div>
                        <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                          <div className="text-[.68rem] font-bold uppercase tracking-[0.08em] text-neutral-400">
                            Started
                          </div>
                          <div className="mt-1 font-semibold text-neutral-900">
                            {new Date(subscription.started_at).toLocaleDateString(
                              "en-ZA"
                            )}
                          </div>
                        </div>
                        <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                          <div className="text-[.68rem] font-bold uppercase tracking-[0.08em] text-neutral-400">
                            Access Until
                          </div>
                          <div className="mt-1 font-semibold text-neutral-900">
                            {new Date(subscription.current_period_end).toLocaleDateString(
                              "en-ZA"
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-neutral-500 leading-5">
                        {isActive
                          ? subscription.is_assigned
                            ? "This subscription is still renewing for the child until you cancel it."
                            : "This subscription is active on your account and can be assigned to a child later."
                          : isCancelled
                          ? subscription.is_assigned
                            ? "Cancellation is already scheduled, and the child keeps access until the current paid period ends."
                            : "Cancellation is already scheduled, and this unassigned subscription stays active until the current paid period ends."
                          : "This subscription has already ended."}
                      </p>

                      {isActive && (
                        <div className="mt-4">
                          <Button
                            type="button"
                            variant="danger-ghost"
                            size="sm"
                            loading={cancellingReference === subscription.reference}
                            onClick={() =>
                              handleCancelSubscription(subscription.reference)
                            }
                          >
                            Cancel Subscription
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3.5">
          {/* Notifications */}
          <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-6">
            <div className="text-[.9rem] font-bold mb-4">Notifications</div>
            <div className="flex flex-col gap-3.5">
              {(
                [
                  {
                    label: "Child activity updates",
                    key: "childActivity" as const,
                  },
                  {
                    label: "Payment receipts",
                    key: "paymentReceipts" as const,
                  },
                  {
                    label: "New course recommendations",
                    key: "newCourses" as const,
                  },
                  {
                    label: "Weekly progress report",
                    key: "weeklyReport" as const,
                  },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-[.85rem]">{item.label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifications[item.key]}
                    onClick={() =>
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                    className={`relative w-10 h-[22px] rounded-full transition-colors ${
                      notifications[item.key]
                        ? "bg-primary"
                        : "bg-neutral-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full transition-transform ${
                        notifications[item.key]
                          ? "translate-x-[18px]"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-6">
            <div className="text-[.9rem] font-bold mb-4">Account</div>
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span className="text-neutral-500">Role</span>
                <span className="font-semibold text-neutral-800 capitalize">
                  {user?.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Account status</span>
                <span
                  className={`font-semibold ${
                    user?.is_approved ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {user?.is_approved ? "Active" : "Pending approval"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
