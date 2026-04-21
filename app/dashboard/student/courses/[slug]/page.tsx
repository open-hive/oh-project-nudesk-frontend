"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  BookOpen,
  Video,
  Clock,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  EnrollmentDetail,
  ModuleProgress,
  CourseDetail,
  CourseModule,
  PaginatedResponse,
  Enrollment,
  QuizQuestion,
  QuizSubmitResponse,
} from "@/lib/types";

const typeIconMap: Record<string, React.ElementType> = {
  video: Video,
  reading: FileText,
  document: FileText,
  quiz: HelpCircle,
};

function getTypes(mod: CourseModule): string[] {
  return mod.content_type ? mod.content_type.split(",").filter(Boolean) : ["video"];
}

export default function CoursePlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <AuthGuard allowedRoles={["student"]}>
      <PlayerInner slug={slug} />
    </AuthGuard>
  );
}

function PlayerInner({ slug }: { slug: string }) {
  const { tokens } = useAuth();
  const toast = useToast();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({}); // question_id → answer_id
  const [quizResult, setQuizResult] = useState<QuizSubmitResponse | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tokens?.access) return;
    setLoading(true);
    try {
      const courseData = await apiFetch<CourseDetail>(`/courses/${slug}/`);
      setCourse(courseData);

      const enrollments = await apiFetch<PaginatedResponse<Enrollment>>(
        "/students/enrollments/",
        { token: tokens.access }
      );
      const match = enrollments.results.find((e) => e.course_slug === slug);
      if (!match) {
        toast.error("You are not enrolled in this course.");
        return;
      }

      const detail = await apiFetch<EnrollmentDetail>(
        `/students/enrollments/${match.id}/`,
        { token: tokens.access }
      );
      setEnrollment(detail);

      const sorted = [...courseData.modules].sort((a, b) => a.order - b.order);
      const progressMap = new Map(detail.module_progress.map((mp) => [mp.module, mp]));
      const firstIncomplete = sorted.find((m) => !progressMap.get(m.id)?.is_completed);
      setActiveModuleId(firstIncomplete?.id ?? sorted[0]?.id ?? null);
    } catch {
      toast.error("Failed to load course.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset quiz state when active module changes
  useEffect(() => {
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizResult(null);
  }, [activeModuleId]);

  // Load quiz questions when module with quiz type is active
  useEffect(() => {
    if (!activeModuleId || !tokens?.access || !course || !enrollment) return;
    const mod = course.modules.find((m) => m.id === activeModuleId);
    if (!mod || !getTypes(mod).includes("quiz")) return;
    setQuizLoading(true);
    apiFetch<QuizQuestion[]>(`/courses/${slug}/modules/${activeModuleId}/quiz/`, { token: tokens.access })
      .then((qs) => setQuizQuestions(qs))
      .catch(() => setQuizQuestions([]))
      .finally(() => setQuizLoading(false));
  }, [activeModuleId, tokens, course, enrollment, slug]);

  // Time heartbeat
  useEffect(() => {
    if (!enrollment || !activeModuleId || !tokens?.access) return;
    heartbeatRef.current = setInterval(async () => {
      try {
        await apiFetch(
          `/students/enrollments/${enrollment.id}/modules/${activeModuleId}/time/`,
          { token: tokens.access, method: "POST", body: JSON.stringify({ minutes: 1 }) }
        );
      } catch { /* silent */ }
    }, 60_000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [enrollment, activeModuleId, tokens]);

  // Log module access
  useEffect(() => {
    if (!enrollment || !activeModuleId || !tokens?.access) return;
    apiFetch(
      `/students/enrollments/${enrollment.id}/modules/${activeModuleId}/`,
      { token: tokens.access, method: "POST" }
    ).catch(() => {});
  }, [enrollment, activeModuleId, tokens]);

  async function handleComplete() {
    if (!enrollment || !activeModuleId || !tokens?.access) return;
    setCompleting(true);
    try {
      await apiFetch(
        `/students/enrollments/${enrollment.id}/modules/${activeModuleId}/complete/`,
        { token: tokens.access, method: "POST", body: JSON.stringify({ time_spent_minutes: 0 }) }
      );
      toast.success("Module completed!");
      await fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = typeof err.body?.detail === "string" ? err.body.detail : "Could not mark complete.";
        toast.error(msg);
      }
    } finally {
      setCompleting(false);
    }
  }

  async function handleQuizSubmit() {
    if (!tokens?.access || !activeModuleId) return;
    if (quizQuestions.length === 0) return;
    const unanswered = quizQuestions.filter((q) => quizAnswers[q.id] == null);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions (${unanswered.length} remaining).`);
      return;
    }
    setQuizSubmitting(true);
    try {
      const result = await apiFetch<QuizSubmitResponse>(
        `/courses/${slug}/modules/${activeModuleId}/quiz/submit/`,
        {
          token: tokens.access,
          method: "POST",
          body: JSON.stringify({ answers: quizAnswers }),
        }
      );
      setQuizResult(result);
    } catch {
      toast.error("Failed to submit quiz.");
    } finally {
      setQuizSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-neutral-400 mb-4">Course not found or you are not enrolled.</p>
        <Button variant="primary" size="sm" href="/dashboard/student/courses">Back to Courses</Button>
      </div>
    );
  }

  const sortedModules = [...course.modules].sort((a, b) => a.order - b.order);
  const progressMap = new Map(enrollment.module_progress.map((mp) => [mp.module, mp]));
  const activeModule = sortedModules.find((m) => m.id === activeModuleId);
  const activeProgress = activeModuleId ? progressMap.get(activeModuleId) : null;

  const completedCount = enrollment.module_progress.filter((mp) => mp.is_completed).length;
  const totalCount = sortedModules.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/dashboard/student/courses" className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">{course.title}</h2>
          <div className="text-[.78rem] text-neutral-500 mt-0.5">
            {completedCount}/{totalCount} modules complete · {progressPct}%
          </div>
        </div>
        <Badge variant={progressPct === 100 ? "green" : "violet"}>
          {progressPct === 100 ? "Completed" : `${progressPct}%`}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-neutral-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-violet-600 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar — module list */}
        <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl overflow-hidden self-start lg:sticky lg:top-4">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h3 className="text-sm font-bold">Course Content</h3>
          </div>
          <div className="flex flex-col">
            {sortedModules.map((m, i) => {
              const mp = progressMap.get(m.id);
              const isActive = m.id === activeModuleId;
              const done = mp?.is_completed;
              const types = getTypes(m);
              const FirstIcon = typeIconMap[types[0]] || BookOpen;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModuleId(m.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-neutral-100 last:border-b-0 ${
                    isActive ? "bg-violet-50 border-l-[3px] border-l-violet-600" : "hover:bg-neutral-50"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-300 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[.82rem] font-semibold truncate ${isActive ? "text-violet-700" : ""}`}>
                      {i + 1}. {m.title}
                    </div>
                    <div className="flex items-center gap-2 text-[.7rem] text-neutral-400 mt-0.5 flex-wrap">
                      {types.map((t) => {
                        const Icon = typeIconMap[t] || BookOpen;
                        return <span key={t} className="flex items-center gap-0.5 capitalize"><Icon className="w-2.5 h-2.5" />{t}</span>;
                      })}
                      {m.duration_minutes != null && m.duration_minutes > 0 && (
                        <><span>·</span><span>{m.duration_minutes} min</span></>
                      )}
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-violet-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content area */}
        <div>
          {activeModule ? (
            <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl overflow-hidden">
              {/* Video player — shown if module has video type */}
              {getTypes(activeModule).includes("video") && activeModule.content_url && (
                <div className="aspect-video bg-black">
                  {/youtube\.com\/watch|youtu\.be\/|youtube\.com\/embed/.test(activeModule.content_url) ? (
                    <iframe
                      key={activeModule.id}
                      src={`https://www.youtube.com/embed/${new URL(activeModule.content_url.replace("youtu.be/", "youtube.com/watch?v=")).searchParams.get("v") ?? activeModule.content_url.split("/").pop()}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <video key={activeModule.id} src={activeModule.content_url} controls className="w-full h-full" />
                  )}
                </div>
              )}

              <div className="p-6 flex flex-col gap-6">
                {/* Module header */}
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {getTypes(activeModule).map((t) => (
                      <Badge key={t} variant="violet" className="capitalize">{t}</Badge>
                    ))}
                    {activeModule.duration_minutes != null && activeModule.duration_minutes > 0 && (
                      <span className="flex items-center gap-1 text-[.78rem] text-neutral-400">
                        <Clock className="w-3 h-3" />{activeModule.duration_minutes} min
                      </span>
                    )}
                    {activeProgress?.time_spent_minutes != null && activeProgress.time_spent_minutes > 0 && (
                      <span className="text-[.78rem] text-neutral-400">· {activeProgress.time_spent_minutes} min spent</span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold">{activeModule.title}</h3>
                </div>

                {/* Description */}
                {activeModule.description && (
                  <div className="prose prose-sm max-w-none text-neutral-600 whitespace-pre-line">
                    {activeModule.description}
                  </div>
                )}

                {/* Reading link */}
                {getTypes(activeModule).includes("reading") && activeModule.content_url && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Reading</p>
                    <a
                      href={activeModule.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Open reading material
                    </a>
                  </div>
                )}

                {/* Document download */}
                {getTypes(activeModule).includes("document") && (activeModule.file || activeModule.content_url) && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Document</p>
                    <a
                      href={activeModule.file || activeModule.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Download Document
                    </a>
                  </div>
                )}

                {/* Quiz section */}
                {getTypes(activeModule).includes("quiz") && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Quiz</p>
                    {quizLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <svg className="animate-spin w-5 h-5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>
                      </div>
                    ) : quizQuestions.length === 0 ? (
                      <p className="text-sm text-neutral-400">No quiz questions available.</p>
                    ) : quizResult ? (
                      /* Results view */
                      <div className="flex flex-col gap-4">
                        <div className={`rounded-2xl p-5 text-center border-2 ${quizResult.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                          <div className={`text-3xl font-extrabold mb-1 ${quizResult.passed ? "text-green-700" : "text-red-700"}`}>
                            {quizResult.score_pct}%
                          </div>
                          <div className={`text-sm font-semibold ${quizResult.passed ? "text-green-600" : "text-red-600"}`}>
                            {quizResult.score}/{quizResult.total} correct · {quizResult.passed ? "Passed ✓" : "Try again"}
                          </div>
                        </div>
                        {quizResult.results.map((r, idx) => {
                          const q = quizQuestions[idx];
                          if (!q) return null;
                          return (
                            <div key={r.question_id} className={`rounded-xl border p-4 ${r.is_correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                              <p className="text-sm font-semibold text-neutral-800 mb-2">{idx + 1}. {q.text}</p>
                              <div className="flex flex-col gap-1.5">
                                {[...q.answers].sort((a, b) => a.order - b.order).map((ans) => {
                                  const chosen = r.chosen_answer_id === ans.id;
                                  const correct = r.correct_answer_id === ans.id;
                                  return (
                                    <div
                                      key={ans.id}
                                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                                        correct ? "bg-green-100 border-green-300 text-green-800 font-semibold"
                                        : chosen ? "bg-red-100 border-red-300 text-red-700"
                                        : "border-neutral-200 text-neutral-500"
                                      }`}
                                    >
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${correct ? "bg-green-500" : chosen ? "bg-red-400" : "bg-neutral-200"}`} />
                                      {ans.text}
                                      {correct && <span className="ml-auto text-[.7rem] font-bold text-green-600">Correct</span>}
                                      {chosen && !correct && <span className="ml-auto text-[.7rem] font-bold text-red-500">Your answer</span>}
                                    </div>
                                  );
                                })}
                              </div>
                              {r.explanation && (
                                <p className="text-[.75rem] text-neutral-500 mt-2 italic">💡 {r.explanation}</p>
                              )}
                            </div>
                          );
                        })}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setQuizAnswers({}); setQuizResult(null); }}
                          className="self-start"
                        >
                          Retake Quiz
                        </Button>
                      </div>
                    ) : (
                      /* Quiz attempt view */
                      <div className="flex flex-col gap-4">
                        {[...quizQuestions].sort((a, b) => a.order - b.order).map((q, idx) => (
                          <div key={q.id} className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-neutral-800 mb-3">{idx + 1}. {q.text}</p>
                            <div className="flex flex-col gap-2">
                              {[...q.answers].sort((a, b) => a.order - b.order).map((ans) => {
                                const selected = quizAnswers[q.id] === ans.id;
                                return (
                                  <button
                                    key={ans.id}
                                    type="button"
                                    onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: ans.id }))}
                                    className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl border-[1.5px] text-left transition-colors ${
                                      selected
                                        ? "border-violet-600 bg-violet-50 text-violet-800 font-semibold"
                                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                                    }`}
                                  >
                                    <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selected ? "border-violet-600 bg-violet-600" : "border-neutral-300"}`}>
                                      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                    {ans.text}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            loading={quizSubmitting}
                            onClick={handleQuizSubmit}
                          >
                            Submit Quiz
                          </Button>
                          <span className="text-[.75rem] text-neutral-400">
                            {Object.keys(quizAnswers).length}/{quizQuestions.length} answered
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Complete + Next buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                  {activeProgress?.is_completed ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </div>
                  ) : (
                    <Button variant="primary" size="sm" loading={completing} onClick={handleComplete}>
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Mark as Complete
                    </Button>
                  )}
                  {(() => {
                    const currentIdx = sortedModules.findIndex((m) => m.id === activeModuleId);
                    const nextModule = sortedModules[currentIdx + 1];
                    if (!nextModule) return null;
                    return (
                      <Button variant="secondary" size="sm" onClick={() => setActiveModuleId(nextModule.id)}>
                        Next: {nextModule.title}
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-12 text-center">
              <PlayCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">Select a module from the sidebar to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const typeIcon: Record<string, React.ElementType> = {
  video: Video,
  reading: FileText,
  document: FileText,
  quiz: BookOpen,
};

export default function CoursePlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <AuthGuard allowedRoles={["student"]}>
      <PlayerInner slug={slug} />
    </AuthGuard>
  );
}

function PlayerInner({ slug }: { slug: string }) {
  const { tokens } = useAuth();
  const toast = useToast();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!tokens?.access) return;
    setLoading(true);
    try {
      // Get course detail
      const courseData = await apiFetch<CourseDetail>(`/courses/${slug}/`);
      setCourse(courseData);

      // Find enrollment for this course
      const enrollments = await apiFetch<PaginatedResponse<Enrollment>>(
        "/students/enrollments/",
        { token: tokens.access }
      );
      const match = enrollments.results.find((e) => e.course_slug === slug);
      if (!match) {
        toast.error("You are not enrolled in this course.");
        return;
      }

      // Get enrollment detail with module progress
      const detail = await apiFetch<EnrollmentDetail>(
        `/students/enrollments/${match.id}/`,
        { token: tokens.access }
      );
      setEnrollment(detail);

      // Set active module: first incomplete, or first module
      const sorted = [...courseData.modules].sort(
        (a, b) => a.order - b.order
      );
      const progressMap = new Map(
        detail.module_progress.map((mp) => [mp.module, mp])
      );
      const firstIncomplete = sorted.find(
        (m) => !progressMap.get(m.id)?.is_completed
      );
      setActiveModuleId(firstIncomplete?.id ?? sorted[0]?.id ?? null);
    } catch {
      toast.error("Failed to load course.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Time heartbeat — sends 1 minute every 60s
  useEffect(() => {
    if (!enrollment || !activeModuleId || !tokens?.access) return;
    heartbeatRef.current = setInterval(async () => {
      try {
        await apiFetch(
          `/students/enrollments/${enrollment.id}/modules/${activeModuleId}/time/`,
          {
            token: tokens.access,
            method: "POST",
            body: JSON.stringify({ minutes: 1 }),
          }
        );
      } catch {
        /* silent */
      }
    }, 60_000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [enrollment, activeModuleId, tokens]);

  // Access module when selected
  useEffect(() => {
    if (!enrollment || !activeModuleId || !tokens?.access) return;
    apiFetch(
      `/students/enrollments/${enrollment.id}/modules/${activeModuleId}/`,
      { token: tokens.access, method: "POST" }
    ).catch(() => {});
  }, [enrollment, activeModuleId, tokens]);

  async function handleComplete() {
    if (!enrollment || !activeModuleId || !tokens?.access) return;
    setCompleting(true);
    try {
      await apiFetch(
        `/students/enrollments/${enrollment.id}/modules/${activeModuleId}/complete/`,
        {
          token: tokens.access,
          method: "POST",
          body: JSON.stringify({ time_spent_minutes: 0 }),
        }
      );
      toast.success("Module completed!");
      await fetchData();
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = typeof err.body?.detail === "string" ? err.body.detail : "Could not mark complete.";
        toast.error(msg);
      }
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="animate-spin w-6 h-6 text-violet-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-neutral-400 mb-4">
          Course not found or you are not enrolled.
        </p>
        <Button variant="primary" size="sm" href="/dashboard/student/courses">
          Back to Courses
        </Button>
      </div>
    );
  }

  const sortedModules = [...course.modules].sort(
    (a, b) => a.order - b.order
  );
  const progressMap = new Map(
    enrollment.module_progress.map((mp) => [mp.module, mp])
  );
  const activeModule = sortedModules.find((m) => m.id === activeModuleId);
  const activeProgress = activeModuleId
    ? progressMap.get(activeModuleId)
    : null;

  const completedCount = enrollment.module_progress.filter(
    (mp) => mp.is_completed
  ).length;
  const totalCount = sortedModules.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href="/dashboard/student/courses"
          className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">
            {course.title}
          </h2>
          <div className="text-[.78rem] text-neutral-500 mt-0.5">
            {completedCount}/{totalCount} modules complete · {progressPct}%
          </div>
        </div>
        <Badge variant={progressPct === 100 ? "green" : "violet"}>
          {progressPct === 100 ? "Completed" : `${progressPct}%`}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-neutral-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-violet-600 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar — module list */}
        <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl overflow-hidden self-start lg:sticky lg:top-4">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h3 className="text-sm font-bold">Course Content</h3>
          </div>
          <div className="flex flex-col">
            {sortedModules.map((m, i) => {
              const mp = progressMap.get(m.id);
              const isActive = m.id === activeModuleId;
              const done = mp?.is_completed;
              const Icon = typeIcon[m.content_type] || BookOpen;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModuleId(m.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-neutral-100 last:border-b-0 ${
                    isActive
                      ? "bg-violet-50 border-l-[3px] border-l-violet-600"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-300 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[.82rem] font-semibold truncate ${isActive ? "text-violet-700" : ""}`}>
                      {i + 1}. {m.title}
                    </div>
                    <div className="flex items-center gap-2 text-[.7rem] text-neutral-400 mt-0.5">
                      <Icon className="w-3 h-3" />
                      <span className="capitalize">{m.content_type}</span>
                      {m.duration_minutes != null && m.duration_minutes > 0 && (
                        <>
                          <span>·</span>
                          <span>{m.duration_minutes} min</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content area */}
        <div>
          {activeModule ? (
            <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl overflow-hidden">
              {/* Video player */}
              {activeModule.content_type === "video" &&
                activeModule.content_url && (
                  <div className="aspect-video bg-black">
                    {/youtube\.com\/watch|youtu\.be\/|youtube\.com\/embed/.test(activeModule.content_url) ? (
                      <iframe
                        key={activeModule.id}
                        src={`https://www.youtube.com/embed/${new URL(activeModule.content_url.replace("youtu.be/", "youtube.com/watch?v=")).searchParams.get("v") ?? activeModule.content_url.split("/").pop()}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      <video
                        key={activeModule.id}
                        src={activeModule.content_url}
                        controls
                        className="w-full h-full"
                      />
                    )}
                  </div>
                )}

              {/* Module header */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="violet" className="capitalize">
                    {activeModule.content_type}
                  </Badge>
                  {activeModule.duration_minutes != null && activeModule.duration_minutes > 0 && (
                    <span className="flex items-center gap-1 text-[.78rem] text-neutral-400">
                      <Clock className="w-3 h-3" />
                      {activeModule.duration_minutes} min
                    </span>
                  )}
                  {activeProgress?.time_spent_minutes != null &&
                    activeProgress.time_spent_minutes > 0 && (
                      <span className="text-[.78rem] text-neutral-400">
                        · {activeProgress.time_spent_minutes} min spent
                      </span>
                    )}
                </div>
                <h3 className="text-xl font-extrabold mb-3">
                  {activeModule.title}
                </h3>

                {/* Reading / description */}
                {activeModule.description && (
                  <div className="prose prose-sm max-w-none text-neutral-600 whitespace-pre-line mb-6">
                    {activeModule.description}
                  </div>
                )}

                {/* File link (reading type) */}
                {activeModule.content_type === "reading" &&
                  activeModule.content_url && (
                    <a
                      href={activeModule.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline mb-6"
                    >
                      <FileText className="w-4 h-4" />
                      Open reading material
                    </a>
                  )}

                {/* Document download */}
                {activeModule.content_type === "document" && (activeModule.file || activeModule.content_url) && (
                  <a
                    href={activeModule.file || activeModule.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors mb-6"
                  >
                    <FileText className="w-4 h-4" />
                    Download Document
                  </a>
                )}

                {/* Generic file (non-document content type with a file attached) */}
                {activeModule.content_type !== "document" && activeModule.file && (
                  <a
                    href={activeModule.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:underline mb-6"
                  >
                    <FileText className="w-4 h-4" />
                    Download file
                  </a>
                )}

                {/* Complete button */}
                <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 mt-4">
                  {activeProgress?.is_completed ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={completing}
                      onClick={handleComplete}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Mark as Complete
                    </Button>
                  )}

                  {/* Next module button */}
                  {(() => {
                    const currentIdx = sortedModules.findIndex(
                      (m) => m.id === activeModuleId
                    );
                    const nextModule = sortedModules[currentIdx + 1];
                    if (!nextModule) return null;
                    return (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setActiveModuleId(nextModule.id)
                        }
                      >
                        Next: {nextModule.title}
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-12 text-center">
              <PlayCircle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-400">
                Select a module from the sidebar to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
