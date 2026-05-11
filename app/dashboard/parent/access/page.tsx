"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Map as MapIcon,
  PlayCircle,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalFoot, ModalHead } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { parentApi, paymentApi, tutorApi, apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  ChildCourseProgress,
  ChildSummary,
  Course,
  LiveClass,
  LiveClassRegistration,
  PaginatedResponse,
  ParentLearningPathItem,
  StudyGuide,
  StudyGuideAccess,
  TutorDiscovery,
  TutorSubscription,
} from "@/lib/types";

type PlannerAssignee = "child" | "self";
type PlanContent =
  | { kind: "course"; id: number; title: string }
  | { kind: "study_guide"; id: number; title: string }
  | { kind: "live_class"; id: number; title: string };

function normalizeSubscriptions(
  data: TutorSubscription[] | PaginatedResponse<TutorSubscription>
) {
  return Array.isArray(data) ? data : data.results ?? [];
}

function parseParamId(value: string | null) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getActiveSubscriptionsForChild(
  subscriptions: TutorSubscription[],
  childId: number | null
) {
  if (!childId) return [];
  const assigned = subscriptions.filter(
    (subscription) =>
      subscription.student === childId && subscription.is_currently_active
  );
  const unassigned = subscriptions.filter(
    (subscription) =>
      subscription.student == null && subscription.is_currently_active
  );
  return [...assigned, ...unassigned];
}

function resolveInitialTutorId(args: {
  childId: number | null;
  subscriptions: TutorSubscription[];
  requestedTutorId: number | null;
  requestedSubscriptionReference: string;
}) {
  const {
    childId,
    subscriptions,
    requestedTutorId,
    requestedSubscriptionReference,
  } = args;
  const childSubscriptions = getActiveSubscriptionsForChild(subscriptions, childId);
  const requestedSubscription = requestedSubscriptionReference
    ? childSubscriptions.find(
        (subscription) => subscription.reference === requestedSubscriptionReference
      ) ?? null
    : null;

  return (
    requestedTutorId ??
    requestedSubscription?.tutor ??
    childSubscriptions[0]?.tutor ??
    null
  );
}

function resolveTutorForChild(args: {
  childId: number | null;
  subscriptions: TutorSubscription[];
  currentTutorId: number | null;
}) {
  const { childId, subscriptions, currentTutorId } = args;
  const childSubscriptions = getActiveSubscriptionsForChild(subscriptions, childId);
  if (
    currentTutorId &&
    childSubscriptions.some((subscription) => subscription.tutor === currentTutorId)
  ) {
    return currentTutorId;
  }
  return childSubscriptions[0]?.tutor ?? null;
}

export default function ParentAccessPage() {
  return (
    <Suspense fallback={<ParentAccessPageFallback />}>
      <ParentAccessPageContent />
    </Suspense>
  );
}

function ParentAccessPageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

function ParentAccessPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tokens } = useAuth();
  const toast = useToast();
  const accessToken = tokens?.access ?? null;
  const [initialRouteContext] = useState(() => ({
    requestedTutorId: parseParamId(searchParams.get("tutor")),
    requestedChildId: parseParamId(searchParams.get("child")),
    focusCourseSlug: searchParams.get("course") ?? "",
    requestedSubscriptionReference: searchParams.get("subscription") ?? "",
  }));
  const {
    requestedTutorId,
    requestedChildId,
    focusCourseSlug,
    requestedSubscriptionReference,
  } = initialRouteContext;

  const [loading, setLoading] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [subscriptions, setSubscriptions] = useState<TutorSubscription[]>([]);
  const [tutor, setTutor] = useState<TutorDiscovery | null>(null);
  const [courses, setCourses] = useState<ChildCourseProgress[]>([]);
  const [courseCatalog, setCourseCatalog] = useState<Course[]>([]);
  const [guides, setGuides] = useState<StudyGuideAccess[]>([]);
  const [guideCatalog, setGuideCatalog] = useState<StudyGuide[]>([]);
  const [liveRegistrations, setLiveRegistrations] = useState<LiveClassRegistration[]>([]);
  const [liveCatalog, setLiveCatalog] = useState<LiveClass[]>([]);
  const [learningPath, setLearningPath] = useState<ParentLearningPathItem[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [plannerAssignee, setPlannerAssignee] = useState<PlannerAssignee>("child");
  const [workingKey, setWorkingKey] = useState<string | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [planContent, setPlanContent] = useState<PlanContent | null>(null);
  const [planDate, setPlanDate] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");

  const selectedChild =
    children.find((child) => child.child_id === selectedChildId) ?? null;

  const activeSubscriptionsForSelectedChild = useMemo(
    () => getActiveSubscriptionsForChild(subscriptions, selectedChildId),
    [selectedChildId, subscriptions]
  );

  const activeSubscription = useMemo(() => {
    if (!selectedTutorId) return null;
    return (
      activeSubscriptionsForSelectedChild.find(
        (subscription) => subscription.tutor === selectedTutorId
      ) ?? null
    );
  }, [activeSubscriptionsForSelectedChild, selectedTutorId]);

  const tutorOptions = useMemo(() => {
    const byTutor = new Map<
      number,
      {
        tutorId: number;
        label: string;
        reference: string | null;
        isInactive: boolean;
        isUnassigned: boolean;
      }
    >();

    for (const subscription of activeSubscriptionsForSelectedChild) {
      if (!byTutor.has(subscription.tutor)) {
        byTutor.set(subscription.tutor, {
          tutorId: subscription.tutor,
          label: subscription.is_assigned
            ? subscription.tutor_name
            : `${subscription.tutor_name} (ready to assign)`,
          reference: subscription.reference,
          isInactive: false,
          isUnassigned: !subscription.is_assigned,
        });
      }
    }

    if (selectedTutorId && !byTutor.has(selectedTutorId)) {
        byTutor.set(selectedTutorId, {
          tutorId: selectedTutorId,
          label: tutor?.tutor_name ?? "Selected tutor",
          reference: null,
          isInactive: true,
          isUnassigned: false,
        });
      }

    return Array.from(byTutor.values());
  }, [activeSubscriptionsForSelectedChild, selectedTutorId, tutor?.tutor_name]);

  const assignedCourseIds = useMemo(
    () => new Set(courses.map((item) => item.course)),
    [courses]
  );
  const assignedGuideIds = useMemo(
    () => new Set(guides.map((item) => item.study_guide)),
    [guides]
  );
  const assignedLiveIds = useMemo(
    () => new Set(liveRegistrations.map((item) => item.live_class)),
    [liveRegistrations]
  );
  const normalizedLibrarySearch = librarySearch.trim().toLowerCase();
  const filteredCourseCatalog = useMemo(() => {
    if (!normalizedLibrarySearch) return courseCatalog;
    return courseCatalog.filter((course) =>
      [course.title, course.category_name, course.tutor_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedLibrarySearch))
    );
  }, [courseCatalog, normalizedLibrarySearch]);
  const filteredGuideCatalog = useMemo(() => {
    if (!normalizedLibrarySearch) return guideCatalog;
    return guideCatalog.filter((guide) =>
      [guide.title, guide.category_name, guide.tutor_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedLibrarySearch))
    );
  }, [guideCatalog, normalizedLibrarySearch]);
  const filteredLiveCatalog = useMemo(() => {
    if (!normalizedLibrarySearch) return liveCatalog;
    return liveCatalog.filter((session) =>
      [session.title, session.description, session.tutor_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedLibrarySearch))
    );
  }, [liveCatalog, normalizedLibrarySearch]);
  const summaryCards = useMemo(
    () => [
      { label: "Assigned courses", value: courses.length, tone: "bg-violet-50 text-violet-700" },
      { label: "Guide access", value: guides.length, tone: "bg-emerald-50 text-emerald-700" },
      { label: "Live sessions", value: liveRegistrations.length, tone: "bg-amber-50 text-amber-700" },
      { label: "Plan items", value: learningPath.length, tone: "bg-orange-50 text-orange-700" },
    ],
    [courses.length, guides.length, learningPath.length, liveRegistrations.length]
  );

  useEffect(() => {
    const token = accessToken;
    if (!token) return;
    let cancelled = false;

    async function loadHeaderData(authToken: string) {
      setLoading(true);
      try {
        const [childData, preferenceData, subscriptionData] = await Promise.all([
          parentApi.getChildren(authToken),
          parentApi.getPreferences(authToken),
          paymentApi.getMySubscriptions(authToken),
        ]);
        if (cancelled) return;
        setChildren(childData);
        const normalizedSubscriptions = normalizeSubscriptions(subscriptionData);
        setSubscriptions(normalizedSubscriptions);
        setPlannerAssignee(preferenceData.default_learning_assignee);

        const nextChildId =
          requestedChildId &&
          childData.some((child) => child.child_id === requestedChildId)
            ? requestedChildId
            : childData[0]?.child_id ?? null;
        setSelectedChildId(nextChildId);
        setSelectedTutorId(
          resolveInitialTutorId({
            childId: nextChildId,
            subscriptions: normalizedSubscriptions,
            requestedTutorId,
            requestedSubscriptionReference,
          })
        );
      } catch {
        if (!cancelled) toast.error("Failed to load parent access data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHeaderData(token);
    return () => {
      cancelled = true;
    };
  }, [accessToken, requestedChildId, requestedSubscriptionReference, requestedTutorId, toast]);

  useEffect(() => {
    let cancelled = false;

    async function loadTutorLibrary(tutorId: number) {
      setLibraryLoading(true);
      try {
        const [tutorData, courseData, guideData, liveData] = await Promise.all([
          tutorApi.getDiscoveryDetail(tutorId),
          apiFetch<PaginatedResponse<Course>>(`/courses/?ordering=newest&tutor=${tutorId}`),
          apiFetch<PaginatedResponse<StudyGuide>>(
            `/courses/study-guides/?ordering=newest&tutor=${tutorId}`
          ),
          apiFetch<PaginatedResponse<LiveClass>>(
            `/courses/live-classes/?ordering=latest&tutor=${tutorId}`
          ),
        ]);
        if (cancelled) return;
        setTutor(tutorData);
        setCourseCatalog(courseData.results ?? []);
        setGuideCatalog(guideData.results ?? []);
        setLiveCatalog(liveData.results ?? []);
      } catch {
        if (!cancelled) {
          setTutor(null);
          setCourseCatalog([]);
          setGuideCatalog([]);
          setLiveCatalog([]);
          toast.error("Failed to load this tutor's library.");
        }
      } finally {
        if (!cancelled) setLibraryLoading(false);
      }
    }

    async function clearTutorLibrary() {
      setLibraryLoading(false);
      setTutor(null);
      setCourseCatalog([]);
      setGuideCatalog([]);
      setLiveCatalog([]);
    }

    if (!selectedTutorId) {
      void clearTutorLibrary();
      return;
    }

    void loadTutorLibrary(selectedTutorId);
    return () => {
      cancelled = true;
    };
  }, [selectedTutorId, toast]);

  async function loadChildAssignments() {
    if (!accessToken || !selectedChildId) {
      setCourses([]);
      setGuides([]);
      setLiveRegistrations([]);
      return;
    }
    try {
      const [courseData, guideData, liveData] = await Promise.all([
        parentApi.getChildCourses(accessToken, selectedChildId),
        parentApi.getChildStudyGuides(accessToken, selectedChildId),
        parentApi.getChildLiveClasses(accessToken, selectedChildId),
      ]);
      setCourses(courseData.results ?? []);
      setGuides(guideData.results ?? []);
      setLiveRegistrations(liveData.results ?? []);
    } catch {
      toast.error("Failed to load the selected child's assigned materials.");
    }
  }

  useEffect(() => {
    const token = accessToken;
    if (!token) return;
    let cancelled = false;

    async function syncChildAssignments(authToken: string) {
      if (!selectedChildId) {
        setCourses([]);
        setGuides([]);
        setLiveRegistrations([]);
        return;
      }
      try {
        const [courseData, guideData, liveData] = await Promise.all([
          parentApi.getChildCourses(authToken, selectedChildId),
          parentApi.getChildStudyGuides(authToken, selectedChildId),
          parentApi.getChildLiveClasses(authToken, selectedChildId),
        ]);
        if (cancelled) return;
        setCourses(courseData.results ?? []);
        setGuides(guideData.results ?? []);
        setLiveRegistrations(liveData.results ?? []);
      } catch {
        if (!cancelled) toast.error("Failed to load the selected child's assigned materials.");
      }
    }

    void syncChildAssignments(token);
    return () => {
      cancelled = true;
    };
  }, [accessToken, selectedChildId, toast]);

  async function loadLearningPath() {
    const token = accessToken;
    if (!token) return;
    try {
      const data = await parentApi.getLearningPath(token, {
        tutor: selectedTutorId ?? undefined,
        assignee_type: plannerAssignee,
        child: plannerAssignee === "child" ? selectedChildId ?? undefined : undefined,
      });
      setLearningPath(data.results ?? []);
    } catch {
      toast.error("Failed to load the learning path.");
    }
  }

  useEffect(() => {
    const token = accessToken;
    if (!token) return;
    let cancelled = false;

    async function syncLearningPath(authToken: string) {
      try {
        const data = await parentApi.getLearningPath(authToken, {
          tutor: selectedTutorId ?? undefined,
          assignee_type: plannerAssignee,
          child: plannerAssignee === "child" ? selectedChildId ?? undefined : undefined,
        });
        if (!cancelled) setLearningPath(data.results ?? []);
      } catch {
        if (!cancelled) toast.error("Failed to load the learning path.");
      }
    }

    void syncLearningPath(token);
    return () => {
      cancelled = true;
    };
  }, [accessToken, plannerAssignee, selectedChildId, selectedTutorId, toast]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const desired = {
      child: selectedChildId ? String(selectedChildId) : null,
      tutor: selectedTutorId ? String(selectedTutorId) : null,
      subscription: activeSubscription?.reference ?? null,
    };

    let changed = false;
    for (const [key, value] of Object.entries(desired)) {
      const currentValue = params.get(key);
      if (value) {
        if (currentValue !== value) {
          params.set(key, value);
          changed = true;
        }
      } else if (currentValue !== null) {
        params.delete(key);
        changed = true;
      }
    }

    if (!changed) return;

    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [
    activeSubscription?.reference,
    pathname,
    router,
    searchParams,
    selectedChildId,
    selectedTutorId,
  ]);

  function handleChildChange(nextChildId: number | null) {
    setSelectedChildId(nextChildId);
    setSelectedTutorId(
      resolveTutorForChild({
        childId: nextChildId,
        subscriptions,
        currentTutorId: selectedTutorId,
      })
    );
  }

  function handleTutorChange(nextTutorId: string) {
    setSelectedTutorId(nextTutorId ? Number(nextTutorId) : null);
  }

  async function assignCourse(courseSlug: string, courseTitle: string) {
    if (!tokens?.access || !selectedChildId) return;
    setWorkingKey(`course:${courseSlug}`);
    try {
      await parentApi.enrollChildInCourse(tokens.access, selectedChildId, courseSlug);
      toast.success(`${selectedChild?.first_name ?? "Child"} now has ${courseTitle}.`);
      await loadChildAssignments();
    } catch (err) {
      const message =
        err instanceof ApiError && typeof err.body?.detail === "string"
          ? err.body.detail
          : "Failed to assign course.";
      toast.error(message);
    } finally {
      setWorkingKey(null);
    }
  }

  async function assignGuide(slug: string, title: string) {
    if (!tokens?.access || !selectedChildId) return;
    setWorkingKey(`guide:${slug}`);
    try {
      await parentApi.grantChildStudyGuideAccess(tokens.access, selectedChildId, slug);
      toast.success(`${selectedChild?.first_name ?? "Child"} now has ${title}.`);
      await loadChildAssignments();
    } catch (err) {
      const message =
        err instanceof ApiError && typeof err.body?.detail === "string"
          ? err.body.detail
          : "Failed to grant guide access.";
      toast.error(message);
    } finally {
      setWorkingKey(null);
    }
  }

  async function assignLiveSession(liveClassId: number, title: string) {
    if (!tokens?.access || !selectedChildId) return;
    setWorkingKey(`live:${liveClassId}`);
    try {
      await parentApi.registerChildInLiveClass(tokens.access, selectedChildId, liveClassId);
      toast.success(`${selectedChild?.first_name ?? "Child"} is now registered for ${title}.`);
      await loadChildAssignments();
    } catch (err) {
      const message =
        err instanceof ApiError && typeof err.body?.detail === "string"
          ? err.body.detail
          : "Failed to register live session.";
      toast.error(message);
    } finally {
      setWorkingKey(null);
    }
  }

  function openPlanner(content: PlanContent) {
    setPlanContent(content);
    setPlanDate(new Date().toISOString().slice(0, 10));
    setPlanNotes("");
    setPlannerOpen(true);
  }

  async function createPlanItem() {
    if (!tokens?.access || !planContent || !planDate) return;
    setWorkingKey(`plan:${planContent.kind}:${planContent.id}`);
    try {
      await parentApi.createLearningPathItem(tokens.access, {
        assignee_type: plannerAssignee,
        child_id: plannerAssignee === "child" ? selectedChildId : null,
        scheduled_for: planDate,
        notes: planNotes.trim(),
        ...(planContent.kind === "course" ? { course_id: planContent.id } : {}),
        ...(planContent.kind === "study_guide" ? { study_guide_id: planContent.id } : {}),
        ...(planContent.kind === "live_class" ? { live_class_id: planContent.id } : {}),
      });
      toast.success("Added to learning path.");
      setPlannerOpen(false);
      setPlanContent(null);
      await loadLearningPath();
    } catch (err) {
      const message =
        err instanceof ApiError && typeof err.body?.detail === "string"
          ? err.body.detail
          : "Failed to add item to the learning path.";
      toast.error(message);
    } finally {
      setWorkingKey(null);
    }
  }

  async function togglePlanComplete(item: ParentLearningPathItem) {
    if (!tokens?.access) return;
    setWorkingKey(`path:${item.id}`);
    try {
      await parentApi.updateLearningPathItem(tokens.access, item.id, {
        is_completed: !item.is_completed,
      });
      await loadLearningPath();
    } catch {
      toast.error("Failed to update the learning path item.");
    } finally {
      setWorkingKey(null);
    }
  }

  async function deletePlanItem(itemId: number) {
    if (!tokens?.access) return;
    setWorkingKey(`delete:${itemId}`);
    try {
      await parentApi.deleteLearningPathItem(tokens.access, itemId);
      await loadLearningPath();
    } catch {
      toast.error("Failed to delete the learning path item.");
    } finally {
      setWorkingKey(null);
    }
  }

  const hasActiveSubscriptions = activeSubscriptionsForSelectedChild.length > 0;
  const activeSubscriptionNeedsAssignment =
    !!activeSubscription && !activeSubscription.is_assigned;
  const selectedTutorName =
    tutor?.tutor_name ??
    activeSubscription?.tutor_name ??
    tutorOptions.find((option) => option.tutorId === selectedTutorId)?.label ??
    "selected tutor";
  const highlightedSubscriptionReference =
    activeSubscription?.reference ??
    (requestedSubscriptionReference &&
    activeSubscriptionsForSelectedChild.some(
      (subscription) => subscription.reference === requestedSubscriptionReference
    )
      ? requestedSubscriptionReference
      : "");
  const searchPlaceholder = selectedTutorId
    ? "Search this tutor's library..."
    : "Select a tutor to load this library";
  const sharedSelectClasses =
    "h-11 w-full min-w-0 rounded-xl border-[1.5px] border-neutral-200 bg-white px-3 pr-9 text-[.92rem] focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">Access & Plans</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Assign a tutor&apos;s library to a child, or keep items in a parent learning plan before handing them over.
        </p>
      </div>

      {highlightedSubscriptionReference ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-4 text-sm text-violet-900">
          Subscription <strong>{highlightedSubscriptionReference.slice(0, 8)}</strong> is active. The next step is to assign the right materials and build a clear learning path.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-[.9rem] font-bold">Assignment context</div>
                <p className="mt-1 text-sm text-neutral-500">
                  Pick which child should receive access, then assign specific materials from this tutor.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="min-w-0">
                  <label className="block text-[.72rem] font-bold uppercase tracking-[0.07em] text-neutral-500 mb-1.5">
                    Child
                  </label>
                  <select
                    className={sharedSelectClasses}
                    value={selectedChildId ?? ""}
                    onChange={(e) =>
                      handleChildChange(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    {children.length === 0 ? <option value="">No linked children</option> : null}
                    {children.map((child) => (
                      <option key={child.child_id} value={child.child_id}>
                        {child.first_name} {child.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-[.72rem] font-bold uppercase tracking-[0.07em] text-neutral-500 mb-1.5">
                    Tutor library
                  </label>
                  <select
                    className={sharedSelectClasses}
                    value={selectedTutorId ?? ""}
                    onChange={(e) => handleTutorChange(e.target.value)}
                    disabled={!selectedChild}
                  >
                    <option value="">
                      {hasActiveSubscriptions
                        ? "Choose tutor library"
                        : "No active tutor subscriptions"}
                    </option>
                    {tutorOptions.map((option) => (
                      <option key={option.tutorId} value={option.tutorId}>
                        {option.isInactive
                          ? `${option.label} (needs subscription)`
                          : option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-[.72rem] font-bold uppercase tracking-[0.07em] text-neutral-500 mb-1.5">
                    Learning path owner
                  </label>
                  <select
                    className={sharedSelectClasses}
                    value={plannerAssignee}
                    onChange={(e) => setPlannerAssignee(e.target.value as PlannerAssignee)}
                  >
                    <option value="child">Linked child</option>
                    <option value="self">Parent self</option>
                  </select>
                </div>
              </div>
            </div>

            {children.length > 1 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {children.map((child) => {
                  const active = child.child_id === selectedChildId;
                  return (
                    <button
                      key={child.child_id}
                      type="button"
                      onClick={() => handleChildChange(child.child_id)}
                      className={`rounded-full border px-3 py-2 text-left transition-colors ${
                        active
                          ? "border-violet-400 bg-violet-50 text-violet-900"
                          : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-violet-200 hover:bg-violet-50"
                      }`}
                    >
                      <div className="text-sm font-semibold">
                        {child.first_name} {child.last_name}
                      </div>
                      <div className="text-[.7rem] opacity-80">
                        {child.enrolled_courses} courses already enrolled
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[.9rem] font-bold">Tutor subscription status</div>
                <p className="mt-1 text-sm text-neutral-500">
                  {selectedTutorId
                    ? `Managing access for ${selectedTutorName}.`
                    : hasActiveSubscriptions
                    ? "Choose which subscribed tutor library you want to manage for this child."
                    : "Select a child, then subscribe them to a tutor to start assigning materials."}
                </p>
              </div>
              {activeSubscription ? (
                <Badge variant={activeSubscriptionNeedsAssignment ? "amber" : "green"}>
                  {activeSubscriptionNeedsAssignment ? "Ready to assign" : "Active"}
                </Badge>
              ) : !selectedChild ? (
                <Badge variant="neutral">Choose child</Badge>
              ) : !selectedTutorId && hasActiveSubscriptions ? (
                <Badge variant="neutral">Choose tutor</Badge>
              ) : !hasActiveSubscriptions ? (
                <Badge variant="neutral">No active subscription</Badge>
              ) : (
                <Badge variant="amber">Needs subscription</Badge>
              )}
            </div>

            {activeSubscription ? (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-[.7rem] uppercase tracking-[0.08em] text-neutral-400">Beneficiary</div>
                  <div className="mt-1 text-sm font-bold text-neutral-900">
                    {activeSubscription.is_assigned
                      ? selectedChild?.first_name ?? "Child"
                      : "Assign on first material"}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-[.7rem] uppercase tracking-[0.08em] text-neutral-400">Billing</div>
                  <div className="mt-1 text-sm font-bold text-neutral-900 capitalize">
                    {activeSubscription.billing_cycle}
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-[.7rem] uppercase tracking-[0.08em] text-neutral-400">Ends</div>
                  <div className="mt-1 text-sm font-bold text-neutral-900">
                    {new Date(activeSubscription.current_period_end).toLocaleDateString("en-ZA")}
                  </div>
                </div>
              </div>
            ) : null}

            {activeSubscriptionNeedsAssignment ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-neutral-700">
                This subscription is active on your parent account. The first course, guide, or live session you assign from this tutor will attach the subscription to {selectedChild?.first_name ?? "this child"} automatically.
              </div>
            ) : !selectedChild ? (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                Choose a child first, then this page will pull the right tutor library and assignment tools into view.
              </div>
            ) : !selectedTutorId && hasActiveSubscriptions ? (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                Pick a tutor library from the dropdown above to manage what {selectedChild.first_name} should receive next. Any unassigned subscription will attach to this child the first time you assign material.
              </div>
            ) : !hasActiveSubscriptions ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-neutral-700">
                  {selectedChild.first_name} does not have an active tutor subscription yet. Start with tutor discovery, then come back here to assign courses, guides, and live sessions.
                </p>
                <div className="mt-3">
                  <Button variant="secondary" size="sm" href="/dashboard/parent/tutors">
                    Discover Tutors
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-neutral-700">
                {selectedChild.first_name} does not currently have an active subscription to {selectedTutorName}. Subscribe first, then come back here to assign materials.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[.9rem] font-bold">Management snapshot</div>
                <p className="mt-1 text-sm text-neutral-500">
                  {selectedChild
                    ? selectedTutorId
                      ? `Track what ${selectedChild.first_name} already has before assigning more from this tutor.`
                      : `Choose a tutor library to focus ${selectedChild.first_name}'s assignments.`
                    : "Select a child to review current assignments and plan items."}
                </p>
              </div>
              <div className="relative w-full md:max-w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  disabled={!selectedTutorId}
                  className="h-10 w-full rounded-xl border-[1.5px] border-neutral-200 bg-white pl-9 pr-3 text-sm focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-600/10"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-neutral-200 p-4">
                  <div className={`inline-flex rounded-full px-2 py-1 text-[.68rem] font-bold uppercase tracking-[0.08em] ${card.tone}`}>
                    {card.label}
                  </div>
                  <div className="mt-3 text-2xl font-extrabold text-neutral-900">{card.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[.9rem] font-bold">Courses</div>
              <Badge variant="violet">{filteredCourseCatalog.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {!selectedTutorId ? (
                <p className="text-sm text-neutral-400">Select a tutor to load this library.</p>
              ) : libraryLoading ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading this tutor&apos;s courses...
                </div>
              ) : filteredCourseCatalog.length === 0 ? (
                <p className="text-sm text-neutral-400">No courses published by this tutor yet.</p>
              ) : (
                filteredCourseCatalog.map((course) => {
                  const assigned = assignedCourseIds.has(course.id);
                  const highlighted = focusCourseSlug === course.slug;
                  return (
                    <div
                      key={course.id}
                      className={`rounded-2xl border p-4 ${highlighted ? "border-violet-300 bg-violet-50/60" : "border-neutral-200"}`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-bold text-neutral-900">{course.title}</div>
                          <p className="mt-1 text-xs text-neutral-500">
                            {course.category_name} · {course.module_count} modules
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={assigned ? "secondary" : "primary"}
                            size="sm"
                            disabled={!activeSubscription || assigned}
                            loading={workingKey === `course:${course.slug}`}
                            onClick={() => assignCourse(course.slug, course.title)}
                          >
                            {assigned ? "Assigned" : "Assign Course"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              openPlanner({ kind: "course", id: course.id, title: course.title })
                            }
                          >
                            Add to Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[.9rem] font-bold">Study Guides</div>
              <Badge variant="green">{filteredGuideCatalog.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {!selectedTutorId ? (
                <p className="text-sm text-neutral-400">Select a tutor to load this library.</p>
              ) : libraryLoading ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading this tutor&apos;s study guides...
                </div>
              ) : filteredGuideCatalog.length === 0 ? (
                <p className="text-sm text-neutral-400">No study guides published by this tutor yet.</p>
              ) : (
                filteredGuideCatalog.map((guide) => {
                  const assigned = assignedGuideIds.has(guide.id);
                  return (
                    <div key={guide.id} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-bold text-neutral-900">{guide.title}</div>
                          <p className="mt-1 text-xs text-neutral-500">
                            {guide.category_name} · {guide.page_count || 0} pages
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={assigned ? "secondary" : "primary"}
                            size="sm"
                            disabled={!activeSubscription || assigned}
                            loading={workingKey === `guide:${guide.slug}`}
                            onClick={() => assignGuide(guide.slug, guide.title)}
                          >
                            {assigned ? "Assigned" : "Give Access"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              openPlanner({ kind: "study_guide", id: guide.id, title: guide.title })
                            }
                          >
                            Add to Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[.9rem] font-bold">Live Sessions</div>
              <Badge variant="orange">{filteredLiveCatalog.length}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {!selectedTutorId ? (
                <p className="text-sm text-neutral-400">Select a tutor to load this library.</p>
              ) : libraryLoading ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading this tutor&apos;s live sessions...
                </div>
              ) : filteredLiveCatalog.length === 0 ? (
                <p className="text-sm text-neutral-400">No live sessions scheduled by this tutor yet.</p>
              ) : (
                filteredLiveCatalog.map((session) => {
                  const assigned = assignedLiveIds.has(session.id);
                  return (
                    <div key={session.id} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-bold text-neutral-900">{session.title}</div>
                          <p className="mt-1 text-xs text-neutral-500">
                            {new Date(session.scheduled_date).toLocaleDateString("en-ZA")} · {session.start_time.slice(0, 5)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={assigned ? "secondary" : "primary"}
                            size="sm"
                            disabled={!activeSubscription || assigned}
                            loading={workingKey === `live:${session.id}`}
                            onClick={() => assignLiveSession(session.id, session.title)}
                          >
                            {assigned ? "Assigned" : "Register Child"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              openPlanner({ kind: "live_class", id: session.id, title: session.title })
                            }
                          >
                            Add to Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <MapIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[.9rem] font-bold">Learning Path</div>
                <p className="mt-1 text-sm text-neutral-500">
                  Build a schedule for a child or keep a parent-side planning queue before you assign the material.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[.9rem] font-bold">
                {plannerAssignee === "child"
                  ? `${selectedChild?.first_name ?? "Child"}'s plan`
                  : "Parent self plan"}
              </div>
              <Badge variant={plannerAssignee === "child" ? "orange" : "violet"}>
                {plannerAssignee === "child" ? "Child" : "Parent self"}
              </Badge>
            </div>

            {learningPath.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-400">
                No items scheduled yet. Use the “Add to Plan” actions on courses, guides, and live sessions.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {learningPath.map((item) => {
                  const icon =
                    item.content_type === "course"
                      ? BookOpen
                      : item.content_type === "study_guide"
                      ? FileText
                      : PlayCircle;
                  const Icon = icon;
                  return (
                    <div key={item.id} className="rounded-2xl border border-neutral-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-neutral-900">
                              {item.content_title}
                            </div>
                            <div className="mt-1 text-xs text-neutral-500">
                              {item.tutor_name} · {new Date(item.scheduled_for).toLocaleDateString("en-ZA")}
                            </div>
                            {item.notes ? (
                              <p className="mt-2 text-sm text-neutral-600">{item.notes}</p>
                            ) : null}
                          </div>
                        </div>
                        <Badge variant={item.is_completed ? "green" : "neutral"}>
                          {item.is_completed ? "Done" : "Planned"}
                        </Badge>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={workingKey === `path:${item.id}`}
                          onClick={() => togglePlanComplete(item)}
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          {item.is_completed ? "Mark Planned" : "Mark Done"}
                        </Button>
                        <Button
                          variant="danger-ghost"
                          size="sm"
                          loading={workingKey === `delete:${item.id}`}
                          onClick={() => deletePlanItem(item.id)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="text-[.9rem] font-bold">Quick guidance</div>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <div className="flex gap-2">
                <GraduationCap className="mt-0.5 h-4 w-4 text-violet-600" />
                <span>Subscriptions unlock a tutor&apos;s full paid library for the selected child. They do not automatically enroll every course.</span>
              </div>
              <div className="flex gap-2">
                <Users className="mt-0.5 h-4 w-4 text-orange-600" />
                <span>Use assignment buttons to decide what a child should actually start with, especially when one tutor has many materials.</span>
              </div>
              <div className="flex gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span>Use the learning path to pace work over time or keep a parent-side planning queue before you hand materials over.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={plannerOpen} onClose={() => setPlannerOpen(false)} size="sm">
        <ModalHead
          title="Add to Learning Path"
          subtitle={planContent?.title ?? ""}
          onClose={() => setPlannerOpen(false)}
        />
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-[.8rem] font-semibold text-neutral-700 mb-1.5">
                Plan owner
              </label>
              <select
                className="w-full rounded-xl border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                value={plannerAssignee}
                onChange={(e) => setPlannerAssignee(e.target.value as PlannerAssignee)}
              >
                <option value="child">Linked child</option>
                <option value="self">Parent self</option>
              </select>
            </div>
            <div>
              <label className="block text-[.8rem] font-semibold text-neutral-700 mb-1.5">
                Scheduled for
              </label>
              <input
                type="date"
                className="w-full rounded-xl border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[.8rem] font-semibold text-neutral-700 mb-1.5">
                Notes
              </label>
              <textarea
                className="w-full min-h-[92px] rounded-xl border-[1.5px] border-neutral-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                placeholder="What should the learner focus on here?"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFoot>
          <Button variant="secondary" onClick={() => setPlannerOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={workingKey === `plan:${planContent?.kind}:${planContent?.id}`}
            onClick={() => void createPlanItem()}
          >
            Add Item
          </Button>
        </ModalFoot>
      </Modal>
    </div>
  );
}
