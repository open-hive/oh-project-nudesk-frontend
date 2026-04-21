"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

function getRedirectPath(user: {
  role: string;
  is_profile_complete: boolean;
  is_approved: boolean;
}): string {
  if (!user.is_profile_complete) return "/auth/profile-setup";
  if (user.role === "tutor" && !user.is_approved) return "/auth/pending-approval";
  if (user.role === "admin") return "/dashboard/admin";
  return `/dashboard/${user.role}`;
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "1";
  const toast = useToast();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success("Welcome back!");
      router.push(getRedirectPath(user));
    } catch (err) {
      if (err instanceof ApiError) {
        const detail =
          err.body.detail ??
          (Array.isArray(err.body.non_field_errors)
            ? err.body.non_field_errors[0]
            : null);
        toast.error(
          typeof detail === "string"
            ? detail
            : "Invalid email or password."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-1.5">
        Sign In
      </h1>
      <p className="text-sm text-neutral-500 mb-7">
        No account?{" "}
        <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
          Sign up free &rarr;
        </Link>
      </p>

      {sessionExpired && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
          <span>Your session expired. Please sign in again to continue.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-[.78rem] font-semibold text-neutral-700 mb-1.5">
            Email address
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[.78rem] font-semibold text-neutral-700">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[.78rem] text-primary font-semibold hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              {showPw ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
        >
          Sign In
        </Button>
      </form>
    </div>
  );
}
