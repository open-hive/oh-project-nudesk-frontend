"use client";

import { useEffect, useMemo, useState } from "react";
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
import { apiFetch } from "@/lib/api";
import type { Notification, PaginatedResponse } from "@/lib/types";

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
  const { user, profile, tokens, logout } = useAuth();
  const accessToken = tokens?.access;
  const [profileOpen, setProfileOpen] = useState(false);
  const [materialBadges, setMaterialBadges] = useState({ live: "0", guides: "0" });

  useEffect(() => {
    if (!user || user.role !== "student" || !accessToken) return;
    let cancelled = false;

    async function loadMaterialBadges() {
      try {
        const [scheduledLive, legacyLive, guides] = await Promise.all([
          apiFetch<PaginatedResponse<Notification>>(
            "/notifications/?is_read=false&type=new_live_class_scheduled&limit=1",
            { token: accessToken }
          ),
          apiFetch<PaginatedResponse<Notification>>(
            "/notifications/?is_read=false&type=live_class_created&limit=1",
            { token: accessToken }
          ),
          apiFetch<PaginatedResponse<Notification>>(
            "/notifications/?is_read=false&type=new_study_guide_published&limit=1",
            { token: accessToken }
          ),
        ]);
        if (cancelled) return;
        const liveCount = scheduledLive.count + legacyLive.count;
        setMaterialBadges({
          live: liveCount > 0 ? String(liveCount) : "0",
          guides: guides.count > 0 ? String(guides.count) : "0",
        });
      } catch {
        if (!cancelled) setMaterialBadges({ live: "0", guides: "0" });
      }
    }

    void loadMaterialBadges();
    return () => {
      cancelled = true;
    };
  }, [accessToken, pathname, user]);

  const sections: SidebarSection[] = useMemo(() => {
    const canUseStudentSubscriptions =
      !(user?.is_parent_managed_child && !user.can_self_subscribe);

    return [
      {
        title: "Main",
        links: [
          { label: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
          ...(canUseStudentSubscriptions
            ? [{ label: "Discover Tutors", href: "/dashboard/student/tutors", icon: Users }]
            : []),
          { label: "My Courses", href: "/dashboard/student/courses", icon: PlayCircle },
          {
            label: "Live Classes",
            href: "/dashboard/student/live",
            icon: Video,
            badge: materialBadges.live !== "0" ? materialBadges.live : undefined,
          },
          {
            label: "Study Guides",
            href: "/dashboard/student/guides",
            icon: BookOpen,
            badge: materialBadges.guides !== "0" ? materialBadges.guides : undefined,
          },
          { label: "Certificates", href: "/dashboard/student/certificates", icon: Award },
          { label: "Progress", href: "/dashboard/student/progress", icon: BarChart2 },
        ],
      },
      {
        title: "Account",
        links: [{ label: "Settings", href: "/dashboard/student/settings", icon: Settings }],
      },
    ];
  }, [materialBadges.guides, materialBadges.live, user]);

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
