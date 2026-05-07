"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, GraduationCap, Users, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

type SelectedRole = "child" | "parent" | "tutor";

function normalizeRole(value: string | null): SelectedRole | null {
  if (value === "child" || value === "parent" || value === "tutor") return value;
  if (value === "student") return "child";
  return null;
}

function getRoleLabel(role: SelectedRole) {
  if (role === "child") return "Child";
  if (role === "parent") return "Parent";
  return "Tutor";
}

function getRedirectPath(user: {
  role: string;
  is_profile_complete: boolean;
  is_approved: boolean;
}, nextPath?: string | null): string {
  if (!user.is_profile_complete) return "/auth/profile-setup";
  if (user.role === "tutor" && !user.is_approved) return "/auth/pending-approval";
  if (user.role === "admin") return "/dashboard/admin";
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("/auth")) {
    return nextPath;
  }
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
  const requestedRole = normalizeRole(searchParams.get("role"));
  const nextPath = searchParams.get("next");
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(requestedRole);
  const toast = useToast();
  const { login } = useAuth();

  useEffect(() => {
    setSelectedRole(requestedRole);
  }, [requestedRole]);

  function updateRole(role: SelectedRole | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (role) {
      params.set("role", role);
    } else {
      params.delete("role");
    }
    const qs = params.toString();
    router.replace(qs ? `/auth/signin?${qs}` : "/auth/signin");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success("Welcome back!");
      router.push(getRedirectPath(user, nextPath));
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

  if (!selectedRole) {
    return (
      <div className="w-full max-w-[800px]">
        <div className="text-center mb-12">
          <h1 className="text-[2rem] font-extrabold tracking-tight mb-3">
            Choose your role
          </h1>
          <p className="text-base text-neutral-500">
            Select how you'll be using NuDesk to continue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => updateRole("child")}
            className="flex flex-col items-center justify-center p-10 bg-white border border-neutral-200 rounded-3xl hover:border-violet-500 hover:ring-1 hover:ring-violet-500 transition-all text-center group h-full aspect-square"
          >
            <div className="w-20 h-20 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Child</h3>
            <p className="text-sm text-neutral-500">Log in to your student dashboard</p>
          </button>

          <button
            onClick={() => updateRole("parent")}
            className="flex flex-col items-center justify-center p-10 bg-white border border-neutral-200 rounded-3xl hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all text-center group h-full aspect-square"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Parent</h3>
            <p className="text-sm text-neutral-500">Manage your children's learning</p>
          </button>

          <button
            onClick={() => updateRole("tutor")}
            className="flex flex-col items-center justify-center p-10 bg-white border border-neutral-200 rounded-3xl hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all text-center group h-full aspect-square"
          >
            <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Tutor</h3>
            <p className="text-sm text-neutral-500">Access your teaching tools</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <button
        onClick={() => updateRole(null)}
        className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to roles
      </button>

      <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-1.5">
        Sign In as {getRoleLabel(selectedRole)}
      </h1>
      <p className="text-sm text-neutral-500 mb-7">
        No account?{" "}
        <Link href={`/auth/signup?role=${selectedRole}`} className="text-primary font-semibold hover:underline">
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
