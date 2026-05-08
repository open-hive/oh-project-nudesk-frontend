"use client";

import { Button } from "@/components/ui/button";
import { TutorDiscoveryDashboard } from "@/components/dashboard/tutor-discovery";
import { useAuth } from "@/lib/auth-context";

export default function StudentTutorsPage() {
  const { user } = useAuth();

  if (user?.is_parent_managed_child && !user.can_self_subscribe) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8">
        <h2 className="text-[1.2rem] font-extrabold tracking-[-0.02em] text-neutral-900">
          Tutor discovery is managed by your parent
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          This learner account is linked to a parent or guardian who manages tutor subscriptions. Ask them to subscribe on your behalf, or wait until they enable self-managed subscriptions in parent settings.
        </p>
        <div className="mt-5">
          <Button variant="secondary" size="sm" href="/dashboard/student">
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  return <TutorDiscoveryDashboard mode="student" />;
}
