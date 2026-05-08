"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Radio,
  Plus,
  Edit2,
  Loader2,
  AlertCircle,
  Square,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalHead } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { ScheduleLiveModal } from "@/components/dashboard/schedule-live-modal";
import { LiveClassroom } from "@/components/dashboard/live-classroom";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  LiveClass,
  TutorLiveClassAttendance,
  TurnCredentials,
  PaginatedResponse,
  Category,
} from "@/lib/types";

export default function TutorLivePage() {
  const { tokens, user, profile } = useAuth();
  const toast = useToast();

  const [sessions, setSessions] = useState<LiveClass[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Live session management
  const [inSession, setInSession] = useState(false);
  const [turnCredentials, setTurnCredentials] = useState<TurnCredentials | null>(null);
  const [managingClassId, setManagingClassId] = useState<number | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSession, setAttendanceSession] = useState<LiveClass | null>(null);
  const [attendanceRows, setAttendanceRows] = useState<TutorLiveClassAttendance[]>([]);

  const fetchData = useCallback(async () => {
    if (!tokens?.access) return;
    setLoading(true);
    try {
      const [sessionsRes, catsRes] = await Promise.all([
        apiFetch<PaginatedResponse<LiveClass>>("/courses/my-live-classes/", {
          token: tokens.access,
        }),
        apiFetch<PaginatedResponse<Category>>("/courses/categories/", {
          token: tokens.access,
        }),
      ]);
      setSessions(sessionsRes.results);
      setCategories(catsRes.results);
    } catch {
      toast.error("Failed to load live classes.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.access]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const liveNow = sessions.find((s) => s.status === "live");
  const scheduled = sessions.filter((s) => s.status === "scheduled");
  const pending = sessions.filter((s) => s.status === "pending_review");
  const rejected = sessions.filter((s) => s.status === "rejected");
  const completed = sessions.filter((s) => s.status === "completed");
  const allSessions = [
    ...(liveNow ? [liveNow] : []),
    ...scheduled,
    ...pending,
    ...rejected,
    ...completed,
  ];

  const handleResubmit = async (id: number) => {
    if (!tokens?.access) return;
    try {
      await apiFetch(`/courses/my-live-classes/${id}/submit/`, {
        method: "POST",
        token: tokens.access,
      });
      toast.success("Resubmitted for review!");
      fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error((err.body?.detail as string) || "Failed to resubmit.");
      }
    }
  };

  const handleStart = async (id: number) => {
    if (!tokens?.access) return;
    try {
      await apiFetch(`/courses/my-live-classes/${id}/start/`, {
        method: "POST",
        token: tokens.access,
      });
      toast.success("Live class started!");

      // Get TURN credentials and enter session
      const creds = await apiFetch<TurnCredentials>(
        `/courses/live-classes/${id}/turn-credentials/`,
        { token: tokens.access }
      );
      setTurnCredentials(creds);
      setManagingClassId(id);
      setInSession(true);
      fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(
          (err.body?.detail as string) || "Failed to start live class."
        );
      }
    }
  };

  const handleManage = async (id: number) => {
    if (!tokens?.access) return;
    try {
      const creds = await apiFetch<TurnCredentials>(
        `/courses/live-classes/${id}/turn-credentials/`,
        { token: tokens.access }
      );
      setTurnCredentials(creds);
      setManagingClassId(id);
      setInSession(true);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(
          (err.body?.detail as string) || "Failed to join session."
        );
      }
    }
  };

  const handleEnd = async () => {
    if (!managingClassId || !tokens?.access) return;
    try {
      await apiFetch(`/courses/my-live-classes/${managingClassId}/end/`, {
        method: "POST",
        token: tokens.access,
      });
      toast.success("Live class ended.");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(
          (err.body?.detail as string) || "Failed to end live class."
        );
      }
    }
    setInSession(false);
    setTurnCredentials(null);
    setManagingClassId(null);
    fetchData();
  };

  const handleLeaveSession = () => {
    setInSession(false);
    setTurnCredentials(null);
    setManagingClassId(null);
    toast.warning("You left the session.");
    fetchData();
  };

  const handleCreated = () => {
    fetchData();
  };

  const handleReviewAttendance = async (session: LiveClass) => {
    if (!tokens?.access) return;
    setAttendanceSession(session);
    setAttendanceOpen(true);
    setAttendanceLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<TutorLiveClassAttendance>>(
        `/courses/my-live-classes/${session.id}/attendance/`,
        {
          token: tokens.access,
        }
      );
      setAttendanceRows(data.results);
    } catch {
      toast.error("Failed to load attendance.");
      setAttendanceRows([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const attendedCount = attendanceRows.filter((row) => row.attended).length;
  const missedCount = attendanceRows.length - attendedCount;

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user?.username ?? "Tutor";

  // Full-screen live session
  if (inSession && turnCredentials && user) {
    return (
      <div className="relative">
        <LiveClassroom
          credentials={turnCredentials}
          userName={displayName}
          userId={user.id}
          isTutor={true}
          initialAudio={true}
          initialVideo={true}
          onLeave={handleLeaveSession}
          attendeeCount={liveNow?.registered_count ?? 0}
        />
        {/* End session button overlay for tutor */}
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[101]">
          <Button variant="danger" size="lg" onClick={handleEnd}>
            <Square className="w-4 h-4" />
            End Session
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Live Classes
        </h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setScheduleOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule New
        </Button>
      </div>

      {/* Live Now Banner */}
      {liveNow && (
        <div
          className="rounded-2xl p-6 mb-5 flex items-center justify-between flex-wrap gap-4"
          style={{
            background:
              "linear-gradient(135deg, var(--color-violet-600), var(--color-violet-900))",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[.7rem] font-bold text-red-300 bg-red-500/20 border border-red-500/30 rounded-full px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                LIVE NOW
              </span>
            </div>
            <div className="text-base font-bold text-white mb-1">
              {liveNow.title}
            </div>
            <div className="text-[.82rem] text-white/60">
              {liveNow.registered_count} students attending
            </div>
          </div>
          <Button
            variant="accent"
            size="lg"
            onClick={() => handleManage(liveNow.id)}
          >
            <Radio className="w-4 h-4" />
            Manage Session
          </Button>
        </div>
      )}

      {/* Sessions Table */}
      {allSessions.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <div className="text-sm font-medium">No live classes yet</div>
          <div className="text-xs mt-1">
            Click &quot;Schedule New&quot; to create your first live class
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">
                  Session
                </th>
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">
                  Date & Time
                </th>
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">
                  Registered
                </th>
                <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">
                  Status
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allSessions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-neutral-100 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="text-[.875rem] font-semibold">{s.title}</div>
                    {s.status === "rejected" && s.rejection_reason && (
                      <div className="text-[.72rem] text-red-500 mt-0.5">{s.rejection_reason}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[.82rem]">
                    {new Date(s.scheduled_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {s.start_time?.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-[.82rem]">
                    {s.registered_count}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "live" && (
                      <Badge variant="red">
                        <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse mr-1" />
                        Live
                      </Badge>
                    )}
                    {s.status === "scheduled" && <Badge variant="violet">Scheduled</Badge>}
                    {s.status === "pending_review" && (
                      <Badge variant="amber">
                        <Clock className="w-3 h-3" />
                        Pending Review
                      </Badge>
                    )}
                    {s.status === "rejected" && <Badge variant="red">Rejected</Badge>}
                    {s.status === "completed" && <Badge variant="green">Completed</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "live" && (
                      <Button variant="primary" size="sm" onClick={() => handleManage(s.id)}>
                        Manage
                      </Button>
                    )}
                    {s.status === "scheduled" && (
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => handleStart(s.id)}>
                          Start
                        </Button>
                        <Button variant="secondary" size="sm">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {s.status === "pending_review" && (
                      <span className="text-[.75rem] text-neutral-400">Awaiting review</span>
                    )}
                    {s.status === "rejected" && (
                      <Button variant="primary" size="sm" onClick={() => handleResubmit(s.id)}>
                        Resubmit
                      </Button>
                    )}
                    {s.status === "completed" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleReviewAttendance(s)}
                      >
                        Review Attendance
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Modal */}
      <ScheduleLiveModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onCreated={handleCreated}
        token={tokens?.access ?? ""}
        categories={categories}
      />

      <Modal open={attendanceOpen} onClose={() => setAttendanceOpen(false)} size="lg">
        <ModalHead
          title="Attendance Review"
          subtitle={attendanceSession?.title ?? "Live class attendance"}
          onClose={() => setAttendanceOpen(false)}
        />
        <ModalBody>
          {attendanceSession ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-200 p-4">
                  <div className="text-[.7rem] uppercase tracking-[0.08em] text-neutral-400">
                    Registered
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-900">
                    {attendanceRows.length}
                  </div>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="text-[.7rem] uppercase tracking-[0.08em] text-green-700">
                    Completed
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-green-700">
                    {attendedCount}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-[.7rem] uppercase tracking-[0.08em] text-neutral-500">
                    Missed
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-700">
                    {missedCount}
                  </div>
                </div>
              </div>

              {attendanceLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : attendanceRows.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
                  No registrations recorded for this live class yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-neutral-200">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">
                          Student
                        </th>
                        <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">
                          Registered
                        </th>
                        <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRows.map((row) => (
                        <tr key={row.id} className="border-b border-neutral-100 last:border-b-0">
                          <td className="px-4 py-3">
                            <div className="text-[.85rem] font-semibold text-neutral-900">
                              {row.student_name}
                            </div>
                            <div className="text-[.74rem] text-neutral-500">
                              {row.student_email}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[.8rem] text-neutral-600">
                            {new Date(row.registered_at).toLocaleString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={row.completed_session ? "green" : "neutral"}>
                              {row.completed_session ? "Completed" : "Missed"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </ModalBody>
      </Modal>
    </div>
  );
}
