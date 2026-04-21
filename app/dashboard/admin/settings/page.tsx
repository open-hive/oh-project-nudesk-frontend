"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import type { AdminPlatformSettings, AdminUser, PaginatedResponse } from "@/lib/types";

export default function AdminSettingsPage() {
  const { tokens } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingCommission, setSavingCommission] = useState(false);

  // General settings
  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [registrations, setRegistrations] = useState(true);
  const [maintenance, setMaintenance] = useState(false);

  // Commission settings
  const [commissionPct, setCommissionPct] = useState("");

  // Admin users (from /admins/users/?role=admin is not available since admins are excluded)
  // We'll show admin users from a separate fetch of all users with role filtering
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    if (!tokens) return;
    Promise.all([
      apiFetch<AdminPlatformSettings>("/admins/settings/", { token: tokens.access }),
      apiFetch<PaginatedResponse<AdminUser>>("/admins/users/?status=active&page_size=50", { token: tokens.access }).catch(() => null),
    ])
      .then(([settings, usersRes]) => {
        setPlatformName(settings.platform_name || "NuDesk");
        setSupportEmail(settings.support_email || "");
        setCommissionPct(settings.commission_percentage);
        // Show first few users as "admins" context
        if (usersRes) setAdminUsers(usersRes.results.slice(0, 5));
      })
      .catch(() => toast.error("Failed to load settings."))
      .finally(() => setLoading(false));
  }, [tokens, toast]);

  const saveGeneral = useCallback(async () => {
    if (!tokens) return;
    setSavingGeneral(true);
    try {
      const res = await apiFetch<AdminPlatformSettings>("/admins/settings/", {
        token: tokens.access,
        method: "PUT",
        body: JSON.stringify({ platform_name: platformName, support_email: supportEmail }),
      });
      setPlatformName(res.platform_name || platformName);
      setSupportEmail(res.support_email || supportEmail);
      toast.success("General settings saved.");
    } catch {
      toast.error("Failed to save general settings.");
    } finally {
      setSavingGeneral(false);
    }
  }, [tokens, platformName, supportEmail, toast]);

  const saveCommission = useCallback(async () => {
    if (!tokens) return;
    const val = parseFloat(commissionPct);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Commission must be between 0 and 100.");
      return;
    }
    setSavingCommission(true);
    try {
      const res = await apiFetch<AdminPlatformSettings>("/admins/settings/", {
        token: tokens.access,
        method: "PUT",
        body: JSON.stringify({ commission_percentage: commissionPct }),
      });
      setCommissionPct(res.commission_percentage);
      toast.success("Commission settings updated.");
    } catch {
      toast.error("Failed to update commission settings.");
    } finally {
      setSavingCommission(false);
    }
  }, [tokens, commissionPct, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
      </div>
    );
  }

  const tutorShare = (100 - parseFloat(commissionPct || "0")).toFixed(2);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">Platform Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* General */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-[.9rem] font-bold mb-5">General</div>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[.72rem] font-bold uppercase tracking-[0.07em] text-neutral-500 mb-1.5">
                Platform Name
              </label>
              <input
                className="w-full h-10 px-3 text-[.875rem] border-[1.5px] border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[.72rem] font-bold uppercase tracking-[0.07em] text-neutral-500 mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                className="w-full h-10 px-3 text-[.875rem] border-[1.5px] border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>

            {/* Toggle: New Registrations */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
              <div>
                <div className="text-[.875rem] font-semibold">New Registrations</div>
                <div className="text-[.75rem] text-neutral-500">Allow new users to sign up</div>
              </div>
              <button
                type="button"
                onClick={() => setRegistrations(!registrations)}
                className={`relative w-10 h-[22px] rounded-full transition-colors cursor-pointer ${registrations ? "bg-violet-600" : "bg-neutral-300"}`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full transition-transform ${registrations ? "translate-x-[18px]" : ""}`}
                />
              </button>
            </div>

            {/* Toggle: Maintenance */}
            <div className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
              <div>
                <div className="text-[.875rem] font-semibold">Maintenance Mode</div>
                <div className="text-[.75rem] text-neutral-500">Temporarily disable the platform</div>
              </div>
              <button
                type="button"
                onClick={() => setMaintenance(!maintenance)}
                className={`relative w-10 h-[22px] rounded-full transition-colors cursor-pointer ${maintenance ? "bg-violet-600" : "bg-neutral-300"}`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full transition-transform ${maintenance ? "translate-x-[18px]" : ""}`}
                />
              </button>
            </div>

            <Button variant="primary" loading={savingGeneral} onClick={saveGeneral}>
              Save Settings
            </Button>
          </div>
        </div>

        {/* Commission & Payments */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-[.9rem] font-bold mb-5">Commission &amp; Payments</div>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="block text-[.72rem] font-bold uppercase tracking-[0.07em] text-neutral-500 mb-1.5">
                Platform Commission (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-full h-10 px-3 text-[.875rem] border-[1.5px] border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
              />
            </div>

            {/* Commission highlight */}
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="text-[.82rem] font-semibold mb-0.5">Current Commission Rate</div>
              <div className="text-[1.3rem] font-extrabold text-violet-600">
                {commissionPct}% <span className="text-[.8rem] font-medium text-neutral-500">of GMV</span>
              </div>
              <div className="text-[.75rem] text-neutral-500 mt-1">
                Tutors receive {tutorShare}% of each transaction
              </div>
            </div>

            <Button variant="secondary" loading={savingCommission} onClick={saveCommission}>
              Update Commission
            </Button>
          </div>
        </div>

        {/* Platform Users — full width */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[.9rem] font-bold">Recent Active Users</div>
            <Badge variant="neutral">{adminUsers.length} shown</Badge>
          </div>
          {adminUsers.length === 0 ? (
            <div className="text-center py-8 text-sm text-neutral-400">No user data available.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">User</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Email</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Role</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Joined</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => {
                  const name = u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username;
                  const initials = u.first_name && u.last_name
                    ? (u.first_name[0] + u.last_name[0]).toUpperCase()
                    : u.username.slice(0, 2).toUpperCase();
                  const roleColors: Record<string, string> = { student: "violet", tutor: "green", admin: "neutral" };
                  return (
                    <tr key={u.id} className="border-b border-neutral-100 last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center text-[.65rem] font-bold shrink-0">
                            {initials}
                          </div>
                          <div className="text-[.875rem] font-semibold">{name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[.82rem]">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={(roleColors[u.role] || "neutral") as "violet" | "green" | "neutral"}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[.78rem] text-neutral-500">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
