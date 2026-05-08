"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, UserPlus, Users, Check, X, Send, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, childLinkApi, paymentApi } from "@/lib/api";
import type { Profile, ParentChildLink, TutorSubscription } from "@/lib/types";

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

export default function StudentSettingsPage() {
  const { user, tokens, fetchProfile } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  const [notifications, setNotifications] = useState({
    liveReminders: true,
    newCourse: true,
    weeklyReport: false,
  });

  const [links, setLinks] = useState<ParentChildLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);
  const [parentEmail, setParentEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [linkActionId, setLinkActionId] = useState<number | null>(null);
  const [subscriptions, setSubscriptions] = useState<TutorSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [cancellingReference, setCancellingReference] = useState<string | null>(
    null
  );

  const canManageSubscriptions =
    user?.role === "student" && !user?.is_parent_managed_child;

  const loadLinks = useCallback(async () => {
    if (!tokens) return;
    setLinksLoading(true);
    try {
      const res = await childLinkApi.getLinks(tokens.access);
      setLinks(res.results ?? []);
    } catch {
      // silently swallow — not critical
    } finally {
      setLinksLoading(false);
    }
  }, [tokens]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLinks();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadLinks]);

  const loadSubscriptions = useCallback(async () => {
    if (!tokens || !canManageSubscriptions) {
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
  }, [canManageSubscriptions, tokens, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubscriptions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSubscriptions]);

  async function handleRequestParent(e: React.FormEvent) {
    e.preventDefault();
    if (!tokens || !parentEmail.trim()) return;
    setRequesting(true);
    try {
      await childLinkApi.requestLink(tokens.access, parentEmail.trim());
      setParentEmail("");
      toast.success("Request sent! Waiting for parent to approve.");
      await loadLinks();
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = err.body.detail ?? err.body.parent_email ?? "Failed to send request.";
        toast.error(typeof msg === "string" ? msg : "Failed to send request.");
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setRequesting(false);
    }
  }

  async function handleAccept(linkId: number) {
    if (!tokens) return;
    setLinkActionId(linkId);
    try {
      await childLinkApi.acceptLink(tokens.access, linkId);
      toast.success("Parent link accepted.");
      await loadLinks();
    } catch {
      toast.error("Failed to accept link.");
    } finally {
      setLinkActionId(null);
    }
  }

  async function handleDecline(linkId: number) {
    if (!tokens) return;
    setLinkActionId(linkId);
    try {
      await childLinkApi.declineLink(tokens.access, linkId);
      toast.success("Request declined.");
      await loadLinks();
    } catch {
      toast.error("Failed to decline request.");
    } finally {
      setLinkActionId(null);
    }
  }

  async function handleRemove(linkId: number) {
    if (!tokens) return;
    setLinkActionId(linkId);
    try {
      await childLinkApi.removeLink(tokens.access, linkId);
      toast.success("Parent link removed.");
      await loadLinks();
    } catch {
      toast.error("Failed to remove link.");
    } finally {
      setLinkActionId(null);
    }
  }

  async function handleCancelSubscription(reference: string) {
    if (!tokens) return;

    const subscription = subscriptions.find((item) => item.reference === reference);
    if (!subscription) return;

    const confirmCancel = window.confirm(
      `Cancel ${subscription.tutor_name}'s ${subscription.billing_cycle} subscription? Access will stay active until ${new Date(
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

  const loadProfile = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const p = await apiFetch<Profile>("/users/profile/setup/", {
        token: tokens.access,
      });
      setFirstName(p.first_name);
      setLastName(p.last_name);
      setBio(p.bio || "");
      setPhone(p.phone || "");
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tokens) return;
    setSaving(true);
    try {
      await apiFetch<Profile>("/users/profile/setup/", {
        method: "PATCH",
        token: tokens.access,
        body: JSON.stringify({ first_name: firstName, last_name: lastName, bio, phone }),
      });
      await fetchProfile();
      toast.success("Profile updated.");
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.body.detail ?? Object.values(err.body).flat().join(", ");
        toast.error(typeof detail === "string" ? detail : "Failed to save.");
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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
          {/* Profile */}
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
                  placeholder="Tell us a bit about yourself..."
                />
              </div>
              <div>
                <Button type="submit" variant="primary" loading={saving}>
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3.5">
          {/* Notifications */}
          <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-6">
            <div className="text-[.9rem] font-bold mb-4">Notifications</div>
            <div className="flex flex-col gap-3.5">
              {([
                { label: "Live class reminders", key: "liveReminders" as const },
                { label: "New course notifications", key: "newCourse" as const },
                { label: "Weekly progress report", key: "weeklyReport" as const },
              ]).map((item) => (
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
        </div>
      </div>

      {canManageSubscriptions && (
        <div className="mt-4 bg-white border-[1.5px] border-neutral-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <div className="text-[.9rem] font-bold">Tutor Subscriptions</div>
              <p className="text-sm text-neutral-500 mt-1">
                Cancel a subscription here if you no longer want it to renew.
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
                        <div className="text-xs text-neutral-500 mt-1 capitalize">
                          {subscription.billing_cycle} billing
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
                          Amount
                        </div>
                        <div className="mt-1 font-semibold text-neutral-900">
                          {formatMoney(subscription.amount)}
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
                        ? "This subscription renews automatically until you cancel it."
                        : isCancelled
                        ? "Cancellation is already scheduled, and access remains active until the end of the current paid period."
                        : "This subscription has ended."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {isActive ? (
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
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          href="/dashboard/student/tutors"
                        >
                          Browse Tutors
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Parent Links */}
      <div className="mt-4 bg-white border-[1.5px] border-neutral-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4.5 h-4.5 text-primary" />
          <div className="text-[.9rem] font-bold">Parent Links</div>
        </div>

        {/* Link a parent */}
        <form onSubmit={handleRequestParent} className="flex gap-2 mb-5">
          <input
            type="email"
            className="flex-1 px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder="Parent's email address"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" loading={requesting}>
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send Request
          </Button>
        </form>

        {linksLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-neutral-400">
            <UserPlus className="w-7 h-7" />
            <p className="text-[.82rem]">No parent links yet. Send a request above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {links.map((link) => {
              const parentName = `${link.parent.first_name} ${link.parent.last_name}`.trim() || link.parent.email;
              const isActing = linkActionId === link.id;

              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-neutral-50 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {link.parent.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[.84rem] font-semibold truncate">{parentName}</div>
                      <div className="text-[.75rem] text-neutral-500 truncate">{link.parent.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {link.status === "active" && (
                      <>
                        <span className="text-[.72rem] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleRemove(link.id)}
                          className="text-[.75rem] text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Remove"}
                        </button>
                      </>
                    )}

                    {link.status === "pending_child_approval" && link.initiated_by === "parent" && (
                      <>
                        <span className="text-[.72rem] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                          Parent request
                        </span>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleAccept(link.id)}
                          className="flex items-center gap-1 text-[.75rem] font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
                        >
                          {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Check className="w-3.5 h-3.5" /> Accept</>}
                        </button>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleDecline(link.id)}
                          className="flex items-center gap-1 text-[.75rem] font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </>
                    )}

                    {link.status === "pending_parent_approval" && link.initiated_by === "child" && (
                      <span className="text-[.72rem] text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                        Awaiting parent approval
                      </span>
                    )}

                    {link.status === "declined" && (
                      <span className="text-[.72rem] text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                        Declined
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
