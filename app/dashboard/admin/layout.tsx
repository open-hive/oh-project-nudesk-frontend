"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Layers,
  BarChart2,
  CreditCard,
  Settings,
} from "lucide-react";
import { Sidebar, type SidebarSection } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { AuthGuard } from "@/components/auth-guard";
import { ProfileEditModal } from "@/components/dashboard/profile-edit-modal";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import type { AdminDashboard } from "@/lib/types";

const titleMap: Record<string, string> = {
  "/dashboard/admin": "Overview",
  "/dashboard/admin/users": "Users",
  "/dashboard/admin/applications": "Applications",
  "/dashboard/admin/content": "Content Review",
  "/dashboard/admin/revenue": "Revenue",
  "/dashboard/admin/payments": "Tutor Payment Configs",
  "/dashboard/admin/settings": "Platform Settings",
};

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const title = titleMap[pathname] || "Dashboard";
  const { user, profile, tokens, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [counts, setCounts] = useState<{ applications: number; content: number } | null>(null);

  useEffect(() => {
    if (!tokens) return;
    apiFetch<AdminDashboard>("/admins/dashboard/", { token: tokens.access })
      .then((d) =>
        setCounts({
          applications: d.pending_tutor_applications,
          content:
            d.pending_courses +
            d.pending_study_guides +
            d.pending_live_classes,
        })
      )
      .catch(() => {});
  }, [tokens]);

  const sections: SidebarSection[] = useMemo(() => [
    {
      title: "Platform",
      links: [
        { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
        { label: "Users", href: "/dashboard/admin/users", icon: Users },
        { label: "Applications", href: "/dashboard/admin/applications", icon: FileCheck, badge: counts && counts.applications > 0 ? String(counts.applications) : undefined },
        { label: "Content Review", href: "/dashboard/admin/content", icon: Layers, badge: counts && counts.content > 0 ? String(counts.content) : undefined },
        { label: "Revenue", href: "/dashboard/admin/revenue", icon: BarChart2 },
        { label: "Payment Configs", href: "/dashboard/admin/payments", icon: CreditCard },
      ],
    },
    {
      title: "Config",
      links: [
        { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
      ],
    },
  ], [counts]);

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user?.username ?? "Admin";
  const initials = profile?.first_name && profile?.last_name
    ? (profile.first_name[0] + profile.last_name[0]).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? "AD";

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-neutral-50">
        <Sidebar
          sections={sections}
          userInitials={initials}
          userName={displayName}
          userRole="Admin"
          avatarColor="green"
          onUserClick={() => setProfileOpen(true)}
          onLogout={logout}
        />
        <div className="md:ml-[240px]">
          <Topbar
            title={title}
            userName={displayName}
            userInitials={initials}
            avatarColor="green"
            searchPlaceholder="Search..."
            onAvatarClick={() => setProfileOpen(true)}
          />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
      <ProfileEditModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </AuthGuard>
  );
}
