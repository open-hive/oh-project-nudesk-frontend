"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCheck,
  CreditCard,
  Loader2,
  Play,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Notification, PaginatedResponse } from "@/lib/types";

interface TopbarProps {
  title: string;
  userName: string;
  userInitials: string;
  avatarColor?: "violet" | "orange" | "green";
  searchPlaceholder?: string;
  onAvatarClick?: () => void;
}

function getNotificationStyle(type: string): {
  bg: string;
  color: string;
  Icon: LucideIcon;
} {
  if (type.startsWith("parent_link")) {
    return { bg: "bg-orange-50", color: "text-orange-500", Icon: Users };
  }
  if (
    type === "live_class_created" ||
    type === "live_class_reminder" ||
    type === "new_live_class_scheduled"
  ) {
    return { bg: "bg-violet-50", color: "text-violet-600", Icon: Play };
  }
  if (type === "new_study_guide_published") {
    return { bg: "bg-emerald-50", color: "text-emerald-600", Icon: BookOpen };
  }
  if (
    type === "payment_received" ||
    type === "parent_payment_completed"
  ) {
    return { bg: "bg-green-50", color: "text-green-600", Icon: CreditCard };
  }
  return { bg: "bg-neutral-100", color: "text-neutral-600", Icon: Calendar };
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)}h ago`;
  if (diffMinutes < 10080) return `${Math.round(diffMinutes / 1440)}d ago`;

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getEndpointFromNext(nextUrl: string) {
  const url = new URL(nextUrl);
  return (url.pathname + url.search).replace(/^\/apis/, "");
}

export function Topbar({
  title,
  userName,
  userInitials,
  avatarColor = "violet",
  searchPlaceholder = "Search...",
  onAvatarClick,
}: TopbarProps) {
  const pathname = usePathname();
  const { tokens } = useAuth();
  const accessToken = tokens?.access;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState<number | null>(
    null
  );
  const bellRef = useRef<HTMLDivElement | null>(null);

  const loadUnreadCount = useCallback(async () => {
    if (!accessToken) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await apiFetch<{ unread_count: number }>(
        "/notifications/unread-count/",
        { token: accessToken }
      );
      setUnreadCount(response.unread_count);
    } catch {
      setUnreadCount(0);
    }
  }, [accessToken]);

  const loadNotifications = useCallback(async () => {
    if (!accessToken) {
      setNotifications([]);
      return;
    }

    setLoadingNotifications(true);
    try {
      let endpoint = "/notifications/";
      const collected: Notification[] = [];
      let pagesLoaded = 0;

      while (endpoint && pagesLoaded < 25) {
        const response = await apiFetch<PaginatedResponse<Notification>>(endpoint, {
          token: accessToken,
        });
        collected.push(...response.results);
        endpoint = response.next ? getEndpointFromNext(response.next) : "";
        pagesLoaded += 1;
      }

      setNotifications(collected);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUnreadCount();
    }, 0);
    const interval = window.setInterval(() => {
      void loadUnreadCount();
    }, 30000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadUnreadCount, pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;

    const timer = window.setTimeout(() => {
      void Promise.all([loadNotifications(), loadUnreadCount()]);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dropdownOpen, loadNotifications, loadUnreadCount]);

  useEffect(() => {
    if (!dropdownOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!bellRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [dropdownOpen]);

  async function handleMarkAllRead() {
    if (!accessToken || unreadCount === 0) return;
    setMarkingAllRead(true);
    try {
      await apiFetch<{ detail: string }>("/notifications/read-all/", {
        method: "POST",
        token: accessToken,
      });
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleMarkRead(notificationId: number) {
    if (!accessToken) return;

    const target = notifications.find(
      (notification) => notification.id === notificationId
    );
    if (!target || target.is_read) return;

    setMarkingNotificationId(notificationId);
    try {
      await apiFetch<Notification>(`/notifications/${notificationId}/read/`, {
        method: "POST",
        token: accessToken,
      });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } finally {
      setMarkingNotificationId(null);
    }
  }

  return (
    <div className="h-[60px] bg-white border-b border-neutral-200 flex items-center px-6 gap-4 sticky top-0 z-50">
      <span className="text-[1.05rem] font-bold tracking-tight">{title}</span>

      <div className="flex items-center gap-3 ml-auto">
        <div className="relative w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-neutral-400" />
          <input
            className="w-full h-9 pl-9 pr-3 text-[.82rem] border-[1.5px] border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder={searchPlaceholder}
          />
        </div>

        <div className="relative" ref={bellRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="relative w-9 h-9 rounded-xl border-[1.5px] border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition-colors"
            aria-label="Notifications"
            aria-expanded={dropdownOpen}
          >
            <Bell className="w-4 h-4 text-neutral-500" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] rounded-full bg-error px-1 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 z-[80] w-[360px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                <div>
                  <div className="text-sm font-bold text-neutral-900">
                    Notifications
                  </div>
                  <div className="text-xs text-neutral-500">
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "All caught up"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAllRead || unreadCount === 0}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {markingAllRead ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3.5 w-3.5" />
                  )}
                  Mark all read
                </button>
              </div>

              {loadingNotifications ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-neutral-400">
                  No notifications yet.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto p-2">
                  {notifications.map((notification) => {
                    const { bg, color, Icon } = getNotificationStyle(
                      notification.notification_type
                    );

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleMarkRead(notification.id)}
                        className={`mb-2 w-full rounded-2xl border px-3 py-3 text-left transition-colors last:mb-0 ${
                          notification.is_read
                            ? "border-neutral-200 bg-white hover:bg-neutral-50"
                            : "border-violet-200 bg-violet-50/50 hover:bg-violet-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-neutral-900">
                                  {notification.title}
                                </div>
                                <p className="mt-1 text-xs leading-5 text-neutral-500">
                                  {notification.message}
                                </p>
                              </div>
                              <div className="shrink-0 text-[11px] font-medium text-neutral-400">
                                {markingNotificationId === notification.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  formatNotificationTime(notification.created_at)
                                )}
                              </div>
                            </div>
                            {!notification.is_read && (
                              <div className="mt-2 inline-flex rounded-full bg-violet-600/10 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                                Unread
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={onAvatarClick} className="cursor-pointer">
          <span className="sr-only">{userName}</span>
          <Avatar initials={userInitials} size="md" color={avatarColor} />
        </button>
      </div>
    </div>
  );
}
