"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { Profile } from "@/lib/types";

export default function TutorSettingsPage() {
  const { user, tokens, fetchProfile } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const profile = await apiFetch<Profile>("/users/profile/setup/", {
        token: tokens.access,
      });
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setBio(profile.bio || "");
      setPhone(profile.phone || "");
    } catch {
      toast.error("Failed to load profile settings.");
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

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!tokens) return;
    setSavingProfile(true);
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
      toast.success("Profile updated.");
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.body.detail ?? Object.values(err.body).flat().join(", ");
        toast.error(typeof detail === "string" ? detail : "Failed to save.");
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const inputCls =
    "w-full h-10 px-3 text-[.875rem] border-[1.5px] border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10";
  const labelCls =
    "block text-[.72rem] font-bold uppercase tracking-[0.07em] text-neutral-500 mb-1.5";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">Settings</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Manage your tutor profile here.
        </p>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-[.9rem] font-bold mb-5">Tutor Profile</div>
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Name</label>
                <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                className="w-full h-10 px-3 text-[.875rem] border-[1.5px] border-neutral-200 rounded-xl bg-neutral-50 text-neutral-500 cursor-not-allowed"
                value={user?.email ?? ""}
                disabled
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+267 XXX XXX XXX" />
            </div>
            <div>
              <label className={labelCls}>Bio</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2.5 text-[.875rem] border-[1.5px] border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell learners about your teaching style and what they can expect."
              />
            </div>
            <Button type="submit" variant="primary" loading={savingProfile}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
