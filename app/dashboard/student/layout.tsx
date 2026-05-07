"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  PlayCircle,
  Video,
  BookOpen,
  Users,
  Award,
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
      { label: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
      { label: "Discover Tutors", href: "/dashboard/student/tutors", icon: Users },
      { label: "My Courses", href: "/dashboard/student/courses", icon: PlayCircle },
      { label: "Live Classes", href: "/dashboard/student/live", icon: Video, badge: "2" },
      { label: "Study Guides", href: "/dashboard/student/guides", icon: BookOpen },
      { label: "Certificates", href: "/dashboard/student/certificates", icon: Award },
      { label: "Progress", href: "/dashboard/student/progress", icon: BarChart2 },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Settings", href: "/dashboard/student/settings", icon: Settings },
    ],
  },
];

const titleMap: Record<string, string> = {
  "/dashboard/student": "Overview",
  "/dashboard/student/tutors": "Discover Tutors",
  "/dashboard/student/courses": "My Courses",
  "/dashboard/student/live": "Live Classes",
  "/dashboard/student/guides": "Study Guides",
  "/dashboard/student/certificates": "Certificates",
  "/dashboard/student/progress": "Progress",
  "/dashboard/student/settings": "Settings",
};

export default function StudentDashboardLayout({
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
    : user?.username ?? "Student";
  const initials = profile?.first_name && profile?.last_name
    ? (profile.first_name[0] + profile.last_name[0]).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? "ST";

  return (
    <AuthGuard allowedRoles={["student"]}>
      <div className="min-h-screen bg-neutral-50">
        <Sidebar
          sections={sections}
          userInitials={initials}
          userName={displayName}
          userRole="Student"
          avatarColor="violet"
          onUserClick={() => setProfileOpen(true)}
          onLogout={logout}
        />
        <div className="md:ml-[240px]">
          <Topbar
            title={title}
            userName={displayName}
            userInitials={initials}
            avatarColor="violet"
            searchPlaceholder="Search courses..."
            onAvatarClick={() => setProfileOpen(true)}
          />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
      <ProfileEditModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </AuthGuard>
  );
}
