"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Search,
  CreditCard,
  Map,
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
      { label: "Overview", href: "/dashboard/parent", icon: LayoutDashboard },
      { label: "Children", href: "/dashboard/parent/children", icon: Users },
      { label: "Discover Tutors", href: "/dashboard/parent/tutors", icon: Search },
      { label: "Browse & Enroll", href: "/dashboard/parent/browse", icon: BookOpen },
      { label: "Access & Plans", href: "/dashboard/parent/access", icon: Map },
      { label: "Payments", href: "/dashboard/parent/payments", icon: CreditCard },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Settings", href: "/dashboard/parent/settings", icon: Settings },
    ],
  },
];

const titleMap: Record<string, string> = {
  "/dashboard/parent": "Overview",
  "/dashboard/parent/children": "Children",
  "/dashboard/parent/tutors": "Discover Tutors",
  "/dashboard/parent/browse": "Browse & Enroll",
  "/dashboard/parent/access": "Access & Plans",
  "/dashboard/parent/payments": "Payments & Subscriptions",
  "/dashboard/parent/settings": "Settings",
};

export default function ParentDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? "Dashboard";
  const { user, profile, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user?.username ?? "Parent";

  const initials =
    profile?.first_name && profile?.last_name
      ? (profile.first_name[0] + profile.last_name[0]).toUpperCase()
      : user?.username?.slice(0, 2).toUpperCase() ?? "PA";

  return (
    <AuthGuard allowedRoles={["parent"]}>
      <div className="min-h-screen bg-neutral-50">
        <Sidebar
          sections={sections}
          userInitials={initials}
          userName={displayName}
          userRole="Parent"
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
