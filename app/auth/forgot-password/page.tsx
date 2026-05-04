"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/users/forgot-password/", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.error("Please wait before requesting another reset email.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-[400px]">
        <div className="text-4xl mb-4">Email sent</div>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-1.5">
          Check your email
        </h1>
        <p className="text-sm text-neutral-500 mb-7 leading-relaxed">
          If an account exists with <strong>{email}</strong>, we&apos;ve sent a
          password reset link. Check your inbox and spam folder.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() => { setSent(false); setEmail(""); }}
          >
            Try a different email
          </Button>
          <Link
            href="/auth/signin"
            className="text-sm text-primary font-semibold text-center hover:underline"
          >
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-1.5">
        Forgot password?
      </h1>
      <p className="text-sm text-neutral-500 mb-7">
        Enter your email and we&apos;ll send you a reset link.
      </p>

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

        <Button variant="primary" size="md" className="w-full" loading={loading}>
          Send Reset Link
        </Button>
      </form>

      <p className="text-sm text-neutral-500 mt-6 text-center">
        Remember your password?{" "}
        <Link href="/auth/signin" className="text-primary font-semibold hover:underline">
          Sign in &rarr;
        </Link>
      </p>
    </div>
  );
}
