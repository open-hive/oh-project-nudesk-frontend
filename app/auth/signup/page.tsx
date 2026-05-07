"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/api";
import type { RegisterPayload } from "@/lib/types";

type SelectedRole = "child" | "parent" | "tutor";

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Economics",
  "Other",
];

const qualifications = [
  "Bachelor's Degree",
  "Master's Degree",
  "PhD / Doctorate",
  "Professional Certification",
];

function normalizeRole(value: string | null): SelectedRole | null {
  if (value === "child" || value === "parent" || value === "tutor") return value;
  if (value === "student") return "child";
  return null;
}

function toRegisterRole(role: SelectedRole): RegisterPayload["role"] {
  if (role === "child") return "student";
  return role;
}

function getRoleLabel(role: SelectedRole) {
  if (role === "child") return "Child";
  if (role === "parent") return "Parent";
  return "Tutor";
}

function PasswordInput({
  value,
  onChange,
  id,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder ?? "Min. 8 characters"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={8}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[.78rem] font-semibold text-neutral-700 mb-1.5">
      {children}
    </label>
  );
}

function extractErrors(body: Record<string, unknown>): string {
  const messages: string[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (Array.isArray(val)) {
      messages.push(...val.map((v) => String(v)));
    } else if (typeof val === "string") {
      messages.push(val);
    } else if (key === "detail" && typeof val === "string") {
      messages.push(val);
    }
  }
  return messages.length > 0 ? messages[0] : "Registration failed. Please try again.";
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpInner />
    </Suspense>
  );
}

function SignUpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = normalizeRole(searchParams.get("role"));
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(requestedRole);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [subject, setSubject] = useState("");
  const [qualification, setQualification] = useState("");
  const [statement, setStatement] = useState("");

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
    router.replace(qs ? `/auth/signup?${qs}` : "/auth/signup");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;

    if (password !== passwordConfirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterPayload = {
        email,
        username,
        password,
        password_confirm: passwordConfirm,
        role: toRegisterRole(selectedRole),
      };

      if (selectedRole === "tutor") {
        payload.subject_area = subject;
        payload.qualifications = qualification;
        payload.statement = statement;
      }

      await apiFetch("/users/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(extractErrors(err.body));
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
            Select how you&apos;ll use NuDesk and we&apos;ll take you to the right signup flow.
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
            <p className="text-sm text-neutral-500">Create a learner account for classes, guides, and live sessions</p>
          </button>

          <button
            onClick={() => updateRole("parent")}
            className="flex flex-col items-center justify-center p-10 bg-white border border-neutral-200 rounded-3xl hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500 transition-all text-center group h-full aspect-square"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Parent</h3>
            <p className="text-sm text-neutral-500">Manage children, subscriptions, and progress from one dashboard</p>
          </button>

          <button
            onClick={() => updateRole("tutor")}
            className="flex flex-col items-center justify-center p-10 bg-white border border-neutral-200 rounded-3xl hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all text-center group h-full aspect-square"
          >
            <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Tutor</h3>
            <p className="text-sm text-neutral-500">Teach, set subscription pricing, and build recurring income</p>
          </button>
        </div>
      </div>
    );
  }

  const roleLabel = getRoleLabel(selectedRole);
  const usernamePlaceholder =
    selectedRole === "tutor"
      ? "dr_sarah"
      : selectedRole === "parent"
      ? "parent_name"
      : "amara_k";
  const emailPlaceholder =
    selectedRole === "tutor"
      ? "you@university.edu"
      : selectedRole === "parent"
      ? "parent@example.com"
      : "learner@example.com";

  return (
    <div className="w-full max-w-[420px]">
      <button
        onClick={() => updateRole(null)}
        className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to roles
      </button>

      <h1 className="text-[1.75rem] font-extrabold tracking-tight mb-1.5">
        Create Account as {roleLabel}
      </h1>
      <p className="text-sm text-neutral-500 mb-6">
        Already have an account?{" "}
        <Link
          href={`/auth/signin?role=${selectedRole}`}
          className="text-primary font-semibold hover:underline"
        >
          Sign in &rarr;
        </Link>
      </p>

      {selectedRole === "tutor" && (
        <div className="mb-4">
          <Badge variant="violet">
            <ShieldCheck className="w-3 h-3 inline mr-1" />
            Manually reviewed · usually 2-3 business days
          </Badge>
        </div>
      )}

      {selectedRole === "parent" && (
        <div className="mb-4">
          <Badge variant="orange">
            <Users className="w-3 h-3 inline mr-1" />
            Subscribe on behalf of linked children
          </Badge>
        </div>
      )}

      {selectedRole === "child" && (
        <div className="mb-4">
          <Badge variant="violet">
            <GraduationCap className="w-3 h-3 inline mr-1" />
            Student dashboard access after signup
          </Badge>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <Label>Username</Label>
          <Input
            placeholder={usernamePlaceholder}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Email address</Label>
          <Input
            type="email"
            placeholder={emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {selectedRole === "tutor" && (
          <>
            <div>
              <Label>Subject Expertise</Label>
              <select
                className="w-full h-10 px-3 text-sm rounded-xl border-[1.5px] border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              >
                <option value="">Select subject...</option>
                {subjects.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Highest Qualification</Label>
              <select
                className="w-full h-10 px-3 text-sm rounded-xl border-[1.5px] border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                required
              >
                <option value="">Select...</option>
                {qualifications.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Brief Introduction</Label>
              <textarea
                className="w-full px-3 py-2.5 text-sm rounded-xl border-[1.5px] border-neutral-200 bg-white text-neutral-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                rows={3}
                placeholder="Your teaching experience, expertise, and how you support learners..."
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <div>
          <Label>Password</Label>
          <PasswordInput
            id={`${selectedRole}-pw`}
            value={password}
            onChange={setPassword}
          />
        </div>

        <div>
          <Label>Confirm Password</Label>
          <PasswordInput
            id={`${selectedRole}-pw-confirm`}
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            placeholder="Repeat your password"
          />
        </div>

        <Button
          type="submit"
          variant={selectedRole === "tutor" ? "accent" : "primary"}
          size="lg"
          className="w-full"
          loading={loading}
        >
          {selectedRole === "tutor"
            ? "Submit Application"
            : selectedRole === "parent"
            ? "Create Parent Account"
            : "Create Child Account"}
        </Button>

        <p className="text-[.75rem] text-neutral-500 text-center">
          By registering you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms
          </a>{" "}
          &amp;{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </form>
    </div>
  );
}
