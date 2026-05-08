"use client";

import { useState, useEffect, useCallback } from "react";
import { Video, PlayCircle, Play, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { PreJoinModal } from "@/components/dashboard/pre-join-modal";
import { LiveClassroom } from "@/components/dashboard/live-classroom";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, paymentApi } from "@/lib/api";
import type {
  LiveClassRegistration,
  LiveClass,
  TurnCredentials,
  PaginatedResponse,
  TutorSubscription,
} from "@/lib/types";

export default function StudentLivePage() {
  const { tokens, user, profile } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [registrations, setRegistrations] = useState<LiveClassRegistration[]>([]);
  const [publicLive, setPublicLive] = useState<LiveClass[]>([]);
  const [subscriptions, setSubscriptions] = useState<TutorSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Pre-join / Live classroom state
  const [preJoinOpen, setPreJoinOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClassTitle, setSelectedClassTitle] = useState("");
  const [inSession, setInSession] = useState(false);
  const [turnCredentials, setTurnCredentials] = useState<TurnCredentials | null>(null);
  const [joinAudio, setJoinAudio] = useState(false);
  const [joinVideo, setJoinVideo] = useState(false);

  // Payment modal state
  const [paymentTarget, setPaymentTarget] = useState<LiveClass | null>(null);
  const canSelfSubscribe =
    !(user?.is_parent_managed_child && !user.can_self_subscribe);

  const fetchData = useCallback(async () => {
    if (!tokens?.access) return;
    setLoading(true);
    try {
      const [regs, live, subscriptionData] = await Promise.all([
        apiFetch<PaginatedResponse<LiveClassRegistration>>(
          "/students/live-classes/",
          { token: tokens.access }
        ),
        apiFetch<PaginatedResponse<LiveClass>>("/courses/live-classes/", {
          token: tokens.access,
        }),
        paymentApi.getMySubscriptions(tokens.access),
      ]);
      setRegistrations(regs.results);
      setPublicLive(live.results);
      setSubscriptions(
        Array.isArray(subscriptionData) ? subscriptionData : subscriptionData.results ?? []
      );
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

  // Derived data
  const liveNow = registrations.find((r) => r.status === "live");
  // Registered upcoming: show scheduled AND live-status registrations (live covered by banner too)
  const upcoming = registrations.filter(
    (r) => r.status === "scheduled" || r.status === "live"
  );
  const past = registrations.filter((r) => r.status === "completed");

  // Also find live classes from public list that user is NOT registered for
  const registeredIds = new Set(registrations.map((r) => r.live_class));
  // Show both scheduled and currently-live unregistered sessions
  const unregisteredUpcoming = publicLive.filter(
    (lc) => (lc.status === "scheduled" || lc.status === "live") && !registeredIds.has(lc.id)
  );

  function hasTutorSubscription(tutorId: number) {
    return subscriptions.some(
      (subscription) =>
        subscription.tutor === tutorId && subscription.is_currently_active
    );
  }

  const handleRegister = async (liveClassId: number) => {
    if (!tokens?.access) return;
    try {
      await apiFetch("/students/live-classes/register/", {
        method: "POST",
        token: tokens.access,
        body: JSON.stringify({ live_class_id: liveClassId }),
      });
      toast.success("Registered for live class!");
      fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        const msg =
          (err.body?.detail as string) || "Failed to register.";
        toast.error(msg);
      }
    }
  };

  const handleJoinClick = (classId: number, title: string) => {
    setSelectedClassId(classId);
    setSelectedClassTitle(title);
    setPreJoinOpen(true);
  };

  const handleJoin = async (settings: {
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => {
    setPreJoinOpen(false);
    if (!selectedClassId || !tokens?.access) return;
    setJoinAudio(settings.audioEnabled);
    setJoinVideo(settings.videoEnabled);

    try {
      // Mark attendance
      await apiFetch(`/courses/live-classes/${selectedClassId}/attendance/`, {
        method: "POST",
        token: tokens.access,
      });

      // Get TURN credentials
      const creds = await apiFetch<TurnCredentials>(
        `/courses/live-classes/${selectedClassId}/turn-credentials/`,
        { token: tokens.access }
      );
      setTurnCredentials(creds);
      setInSession(true);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(
          (err.body?.detail as string) || "Failed to join live class."
        );
      }
    }
  };

  const handleLeaveSession = () => {
    setInSession(false);
    setTurnCredentials(null);
    setSelectedClassId(null);
    toast.warning("You left the session.");
    fetchData();
  };

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user?.username ?? "Student";

  // Full-screen live classroom
  if (inSession && turnCredentials && user) {
    return (
      <LiveClassroom
        credentials={turnCredentials}
        userName={displayName}
        userId={user.id}
        isTutor={false}
        initialAudio={joinAudio}
        initialVideo={joinVideo}
        onLeave={handleLeaveSession}
        attendeeCount={liveNow?.registered_count ?? 0}
      />
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
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
          Live Classes
        </h2>
      </div>

      {/* Live Now Banner */}
      {liveNow && (
        <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-[20px] p-6 mb-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-red-500/15 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full text-[.7rem] font-bold">
                  ● LIVE NOW
                </span>
              </div>
              <div className="text-base font-bold text-white mb-0.5">
                {liveNow.class_title}
              </div>
              <div className="text-[.82rem] text-neutral-400">
                {liveNow.tutor_name} · {liveNow.registered_count} students
                attending
              </div>
            </div>
          </div>
          <Button
            variant="accent"
            size="lg"
            onClick={() =>
              handleJoinClick(liveNow.live_class, liveNow.class_title)
            }
          >
            <Video className="w-4 h-4" />
            Join Now
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-neutral-200">
        <button
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === "upcoming"
              ? "border-primary text-primary"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
          onClick={() => setTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            tab === "past"
              ? "border-primary text-primary"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
          onClick={() => setTab("past")}
        >
          Completed Sessions
        </button>
      </div>

      {/* Upcoming */}
      {tab === "upcoming" && (
        <div className="flex flex-col gap-2.5">
          {upcoming.length === 0 && unregisteredUpcoming.length === 0 && (
            <div className="text-center py-12 text-neutral-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-3" />
              <div className="text-sm font-medium">
                No upcoming live classes
              </div>
              <div className="text-xs mt-1">
                Check back later for new sessions
              </div>
            </div>
          )}

          {/* Registered upcoming */}
          {upcoming.map((reg) => {
            const date = new Date(reg.scheduled_date);
            const dayName = date
              .toLocaleDateString("en-US", { weekday: "short" })
              .toUpperCase();
            const dayNum = date.getDate();

            return (
              <div
                key={reg.id}
                className="bg-white border-[1.5px] border-neutral-200 rounded-xl px-4 py-3.5 flex items-center gap-4"
              >
                <div className="bg-violet-50 border-[1.5px] border-violet-100 rounded-[10px] px-3.5 py-2.5 text-center shrink-0">
                  <div className="text-[.65rem] font-bold text-primary uppercase">
                    {dayName}
                  </div>
                  <div className="text-[1.2rem] font-extrabold text-primary leading-none">
                    {dayNum}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[.9rem] font-bold">
                    {reg.class_title}
                  </div>
                  <div className="text-[.8rem] text-neutral-500 mt-0.5">
                    {reg.tutor_name} · {reg.start_time?.slice(0, 5)}–
                    {reg.end_time?.slice(0, 5)} · Max {reg.max_capacity} students
                  </div>
                </div>
                {reg.status === "live" ? (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleJoinClick(reg.live_class, reg.class_title)}
                  >
                    <Video className="w-4 h-4" />
                    Join Now
                  </Button>
                ) : (
                  <Badge variant="green">Registered</Badge>
                )}
              </div>
            );
          })}

          {/* Unregistered upcoming from public list */}
          {unregisteredUpcoming.map((lc) => {
            const date = new Date(lc.scheduled_date);
            const dayName = date
              .toLocaleDateString("en-US", { weekday: "short" })
              .toUpperCase();
            const dayNum = date.getDate();

            return (
              <div
                key={lc.id}
                className="bg-white border-[1.5px] border-neutral-200 rounded-xl px-4 py-3.5 flex items-center gap-4"
              >
                <div className="bg-orange-50 border-[1.5px] border-orange-100 rounded-[10px] px-3.5 py-2.5 text-center shrink-0">
                  <div className="text-[.65rem] font-bold text-orange-600 uppercase">
                    {dayName}
                  </div>
                  <div className="text-[1.2rem] font-extrabold text-orange-600 leading-none">
                    {dayNum}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[.9rem] font-bold">{lc.title}</div>
                  <div className="text-[.8rem] text-neutral-500 mt-0.5">
                    {lc.tutor_name} · {lc.start_time?.slice(0, 5)}–
                    {lc.end_time?.slice(0, 5)} · Max {lc.max_capacity} students
                    {!lc.is_free && " · Subscription required"}
                  </div>
                </div>
                {lc.is_free || hasTutorSubscription(lc.tutor) ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRegister(lc.id)}
                  >
                    {lc.status === "live"
                      ? lc.is_free
                        ? "Join Free"
                        : "Join with Subscription"
                      : lc.is_free
                      ? "Register"
                      : "Register"}
                  </Button>
                ) : canSelfSubscribe ? (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => setPaymentTarget(lc)}
                  >
                    {lc.status === "live" ? "Join with Subscription" : "Subscribe to Join"}
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" disabled>
                    Managed by Parent
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Past Recordings */}
      {tab === "past" && (
        <div className="flex flex-col gap-2.5">
          {past.length === 0 && (
            <div className="text-center py-12 text-neutral-400">
              <PlayCircle className="w-8 h-8 mx-auto mb-3" />
              <div className="text-sm font-medium">No completed sessions yet</div>
            </div>
          )}
          {past.map((rec) => (
            <div
              key={rec.id}
              className="bg-white border-[1.5px] border-neutral-200 rounded-xl px-4 py-3.5 flex items-center gap-4"
            >
              <div className="w-[60px] h-[44px] rounded-lg bg-neutral-200 flex items-center justify-center shrink-0">
                <PlayCircle className="w-6 h-6 text-neutral-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{rec.class_title}</div>
                <div className="text-[.78rem] text-neutral-500 mt-0.5">
                  {rec.tutor_name} ·{" "}
                  {new Date(rec.scheduled_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={rec.completed_session ? "green" : "neutral"}>
                  {rec.completed_session ? "Completed" : "Missed"}
                </Badge>
                {rec.recording_url ? (
                  <Button
                    variant="outline-v"
                    size="sm"
                    onClick={() => {
                      window.open(rec.recording_url, "_blank");
                    }}
                  >
                    <Play className="w-3 h-3" />
                    Watch
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pre-Join Modal */}
      <PreJoinModal
        open={preJoinOpen}
        onClose={() => setPreJoinOpen(false)}
        onJoin={handleJoin}
        title={selectedClassTitle}
      />

      {/* Payment Modal */}
      {paymentTarget && (
        <PaymentModal
          open={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => {
            if (!tokens || !paymentTarget) return;
            apiFetch("/students/live-classes/register/", {
              method: "POST",
              token: tokens.access,
              body: JSON.stringify({ live_class_id: paymentTarget.id }),
            })
              .then(() => {
                setPaymentTarget(null);
                toast.success("Subscription activated! You can now join when the session goes live.");
                fetchData();
              })
              .catch((err) => {
                toast.error(
                  err instanceof ApiError
                    ? String((err.body as Record<string, string>).detail ?? "Failed to register.")
                    : "Failed to register."
                );
              });
          }}
          tutorId={paymentTarget.tutor}
          tutorName={paymentTarget.tutor_name}
          title={paymentTarget.title}
          plan={paymentTarget.subscription_plan}
        />
      )}
    </div>
  );
}
