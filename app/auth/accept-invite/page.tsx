"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { inviteApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ChildInviteInfo, LoginUser } from "@/lib/types";

type PageState = "loading" | "form" | "expired" | "done" | "error";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const { setAuth } = useAuth();

  const [pageState, setPageState] = useState<PageState>(token ? "loading" : "error");
  const [inviteInfo, setInviteInfo] = useState<ChildInviteInfo | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Validate the token on mount
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function validate() {
      try {
        const info = await inviteApi.validate(token);
        if (!cancelled) {
          setInviteInfo(info);
          setPageState("form");
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 410) {
            setPageState("expired");
          } else {
            setPageState("error");
          }
        }
      }
    }
    validate();
    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await inviteApi.accept(token, {
        username: username.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      // Log the user in automatically
      const loginUser: LoginUser = {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        username: result.user.username,
        is_approved: result.user.is_approved,
        is_profile_complete: result.user.is_profile_complete,
        is_parent_managed_child: true,
        can_self_subscribe: false,
      };
      setAuth(loginUser, { access: result.access, refresh: result.refresh });
      setPageState("done");
      setTimeout(() => router.replace("/dashboard/student"), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, string[] | string>;
        const errors: Record<string, string> = {};
        for (const [key, val] of Object.entries(body)) {
          errors[key] = Array.isArray(val) ? val[0] : String(val);
        }
        setFieldErrors(errors);
      } else {
        setFieldErrors({ non_field_errors: "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="w-full max-w-[420px] text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
        </div>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-2">Validating invite…</h1>
        <p className="text-neutral-500 text-sm">Just a moment.</p>
      </div>
    );
  }

  // ── Expired ──────────────────────────────────────────────────────────
  if (pageState === "expired") {
    return (
      <div className="w-full max-w-[420px] text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-2">Invite expired</h1>
        <p className="text-neutral-500 text-sm mb-6">
          This invite link has either expired or already been used. Ask your parent to send a new one.
        </p>
        <Link href="/auth/signin">
          <Button variant="primary" className="w-full">Go to sign in</Button>
        </Link>
      </div>
    );
  }

  // ── Error / invalid ──────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div className="w-full max-w-[420px] text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-2">Invalid invite</h1>
        <p className="text-neutral-500 text-sm mb-6">
          This invite link is invalid or has already been used.
        </p>
        <Link href="/auth/signin">
          <Button variant="primary" className="w-full">Go to sign in</Button>
        </Link>
      </div>
    );
  }

  // ── Done ─────────────────────────────────────────────────────────────
  if (pageState === "done") {
    return (
      <div className="w-full max-w-[420px] text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-2">You&apos;re all set!</h1>
        <p className="text-neutral-500 text-sm">
          Your account is linked. Redirecting you to your dashboard…
        </p>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[420px]">
      <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-1">Create your account</h1>
      <p className="text-neutral-500 text-sm mb-6">
        <span className="font-semibold text-neutral-700">{inviteInfo?.parent_name}</span> has invited
        you to join NuDesk. Fill in your details to get started.
      </p>

      {/* Read-only email */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-neutral-600 mb-1">Email</label>
        <input
          type="email"
          value={inviteInfo?.email ?? ""}
          disabled
          className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-neutral-50 text-neutral-400 cursor-not-allowed"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* First + last name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="First name"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/60"
            />
            {fieldErrors.first_name && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.first_name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Last name"
              className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/60"
            />
            {fieldErrors.last_name && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.last_name}</p>
            )}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Choose a username"
            className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/60"
          />
          {fieldErrors.username && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.username}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-neutral-600 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
              className="w-full px-3.5 py-2.5 pr-10 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {fieldErrors.non_field_errors && (
          <p className="text-xs text-red-500">{fieldErrors.non_field_errors}</p>
        )}
        {fieldErrors.email && (
          <p className="text-xs text-red-500">{fieldErrors.email}</p>
        )}

        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          Create account &amp; link with {inviteInfo?.parent_name}
        </Button>
      </form>

      <p className="text-center text-xs text-neutral-400 mt-5">
        Already have an account?{" "}
        <Link href="/auth/signin" className="text-orange-500 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[420px] flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
