"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CreditCard,
  LayoutDashboard,
  Layers,
  Video,
  Users,
  BarChart2,
  Settings,
} from "lucide-react";
import { Sidebar, type SidebarSection } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { AuthGuard } from "@/components/auth-guard";
import { ProfileEditModal } from "@/components/dashboard/profile-edit-modal";
import { useAuth } from "@/lib/auth-context";

const sections: SidebarSection[] = [
  {
    title: "Main",
    links: [
      { label: "Overview", href: "/dashboard/tutor", icon: LayoutDashboard },
      { label: "My Content", href: "/dashboard/tutor/content", icon: Layers },
      { label: "Live Classes", href: "/dashboard/tutor/live", icon: Video, badge: "1" },
      { label: "Students", href: "/dashboard/tutor/students", icon: Users },
      { label: "Earnings", href: "/dashboard/tutor/earnings", icon: BarChart2 },
      { label: "Payments", href: "/dashboard/tutor/payments", icon: CreditCard },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Settings", href: "/dashboard/tutor/settings", icon: Settings },
    ],
  },
];

const titleMap: Record<string, string> = {
  "/dashboard/tutor": "Overview",
  "/dashboard/tutor/content": "My Content",
  "/dashboard/tutor/live": "Live Classes",
  "/dashboard/tutor/students": "Students",
  "/dashboard/tutor/earnings": "Earnings",
  "/dashboard/tutor/payments": "Payments",
  "/dashboard/tutor/settings": "Settings",
};

export default function TutorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const title = titleMap[pathname] || "Dashboard";
  const { user, profile, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user?.username ?? "Tutor";
  const initials = profile?.first_name && profile?.last_name
    ? (profile.first_name[0] + profile.last_name[0]).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? "TU";

  return (
    <AuthGuard allowedRoles={["tutor"]}>
      <div className="min-h-screen bg-neutral-50">
        <Sidebar
          sections={sections}
          userInitials={initials}
          userName={displayName}
          userRole="Tutor"
          avatarColor="orange"
          onUserClick={() => setProfileOpen(true)}
          onLogout={logout}
        />
        <div className="md:ml-[240px]">
          <Topbar
            title={title}
            userName={displayName}
            userInitials={initials}
            avatarColor="orange"
            searchPlaceholder="Search content..."
            onAvatarClick={() => setProfileOpen(true)}
          />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
      <ProfileEditModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </AuthGuard>
  );
}
