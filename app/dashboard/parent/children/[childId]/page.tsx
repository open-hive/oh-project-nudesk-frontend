"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  BookOpen,
  Award,
  Activity,
  ChevronLeft,
  Play,
  FileText,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { parentApi } from "@/lib/api";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import type { ChildDetail, ChildCourseProgress } from "@/lib/types";

type Tab = "courses" | "live" | "guides" | "certs" | "activity";

const CERT_GRADIENTS = [
  "from-violet-700 to-violet-900",
  "from-orange-600 to-orange-800",
  "from-teal-700 to-emerald-900",
  "from-blue-700 to-blue-900",
  "from-rose-600 to-rose-800",
];

interface LiveClassItem {
  id: number;
  title: string;
  tutor_name: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number;
}

interface StudyGuideItem {
  id: number;
  title: string;
  description: string;
  cover_image: string | null;
  purchased_at: string;
}

interface CertItem {
  id: number;
  course_title: string;
  issued_at: string;
  download_url?: string;
}

interface ActivityItem {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function ChildDetailPage() {
  const { childId } = useParams<{ childId: string }>();
  const { tokens } = useAuth();
  const [tab, setTab] = useState<Tab>("courses");

  const [child, setChild] = useState<ChildDetail | null>(null);
  const [childLoading, setChildLoading] = useState(true);

  const [courses, setCourses] = useState<ChildCourseProgress[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  const [liveClasses, setLiveClasses] = useState<LiveClassItem[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveLoaded, setLiveLoaded] = useState(false);

  const [studyGuides, setStudyGuides] = useState<StudyGuideItem[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [guidesLoaded, setGuidesLoaded] = useState(false);

  const [certs, setCerts] = useState<CertItem[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [certsLoaded, setCertsLoaded] = useState(false);

  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);

  const numericId = Number(childId);

  // Load child header
  useEffect(() => {
    if (!tokens || !numericId) return;
    setChildLoading(true);
    parentApi
      .getChild(tokens.access, numericId)
      .then(setChild)
      .finally(() => setChildLoading(false));
  }, [tokens, numericId]);

  // Lazy tab loading
  const loadCourses = useCallback(async () => {
    if (!tokens || coursesLoaded || coursesLoading) return;
    setCoursesLoading(true);
    try {
      const res = await parentApi.getChildCourses(tokens.access, numericId);
      setCourses(res.results ?? []);
      setCoursesLoaded(true);
    } finally {
      setCoursesLoading(false);
    }
  }, [tokens, numericId, coursesLoaded, coursesLoading]);

  const loadLive = useCallback(async () => {
    if (!tokens || liveLoaded || liveLoading) return;
    setLiveLoading(true);
    try {
      const res = await parentApi.getChildLiveClasses(tokens.access, numericId);
      setLiveClasses((res.results ?? []) as LiveClassItem[]);
      setLiveLoaded(true);
    } finally {
      setLiveLoading(false);
    }
  }, [tokens, numericId, liveLoaded, liveLoading]);

  const loadGuides = useCallback(async () => {
    if (!tokens || guidesLoaded || guidesLoading) return;
    setGuidesLoading(true);
    try {
      const res = await parentApi.getChildStudyGuides(tokens.access, numericId);
      setStudyGuides((res.results ?? []) as StudyGuideItem[]);
      setGuidesLoaded(true);
    } finally {
      setGuidesLoading(false);
    }
  }, [tokens, numericId, guidesLoaded, guidesLoading]);

  const loadCerts = useCallback(async () => {
    if (!tokens || certsLoaded || certsLoading) return;
    setCertsLoading(true);
    try {
      const res = await parentApi.getChildCertificates(tokens.access, numericId);
      setCerts((res.results ?? []) as CertItem[]);
      setCertsLoaded(true);
    } finally {
      setCertsLoading(false);
    }
  }, [tokens, numericId, certsLoaded, certsLoading]);

  const loadActivity = useCallback(async () => {
    if (!tokens || activityLoaded || activityLoading) return;
    setActivityLoading(true);
    try {
      const res = await parentApi.getChildActivity(tokens.access, numericId);
      setActivityItems((res.results ?? []) as ActivityItem[]);
      setActivityLoaded(true);
    } finally {
      setActivityLoading(false);
    }
  }, [tokens, numericId, activityLoaded, activityLoading]);

  // Load on tab switch
  useEffect(() => {
    if (tab === "courses") loadCourses();
    if (tab === "live") loadLive();
    if (tab === "guides") loadGuides();
    if (tab === "certs") loadCerts();
    if (tab === "activity") loadActivity();
  }, [tab, loadCourses, loadLive, loadGuides, loadCerts, loadActivity]);

  if (childLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="text-center py-16 text-neutral-500 text-sm">
        Child not found.{" "}
        <Link
          href="/dashboard/parent/children"
          className="text-orange-600 hover:underline"
        >
          Go back
        </Link>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "courses", label: "Courses", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "live", label: "Live Classes", icon: <Play className="w-3.5 h-3.5" /> },
    { id: "guides", label: "Study Guides", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "certs", label: "Certificates", icon: <Award className="w-3.5 h-3.5" /> },
    { id: "activity", label: "Activity", icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  function TabSpinner() {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  function EmptyState({ message }: { message: string }) {
    return (
      <p className="text-sm text-neutral-400 text-center py-10">{message}</p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/dashboard/parent/children"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Children
      </Link>

      {/* Child header */}
      <div className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {child.first_name[0]}
            {child.last_name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-[-0.02em]">
              {child.first_name} {child.last_name}
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">{child.email}</p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              {[
                {
                  icon: <BookOpen className="w-3.5 h-3.5" />,
                  value: child.stats.enrolled_courses,
                  label: "Enrolled",
                  color: "text-violet-500",
                },
                {
                  icon: <Target className="w-3.5 h-3.5" />,
                  value: child.stats.completed_courses,
                  label: "Completed",
                  color: "text-green-500",
                },
                {
                  icon: <Award className="w-3.5 h-3.5" />,
                  value: child.stats.certificates_earned,
                  label: "Certs",
                  color: "text-amber-500",
                },
                {
                  icon: <TrendingUp className="w-3.5 h-3.5" />,
                  value: String(child.stats.learning_streak_days ?? 0),
                  label: "Day Streak",
                  color: "text-orange-500",
                },
                {
                  icon: <Clock className="w-3.5 h-3.5" />,
                  value: `${child.stats.total_study_hours ?? 0}h`,
                  label: "Study Time",
                  color: "text-blue-500",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-neutral-50 rounded-xl px-3 py-2.5"
                >
                  <div className={`flex items-center gap-1 mb-1 ${stat.color}`}>
                    {stat.icon}
                    <span className="text-xs text-neutral-500">{stat.label}</span>
                  </div>
                  <p className="text-lg font-bold text-neutral-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar + content */}
      <div className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] overflow-hidden">
        <div className="flex gap-0 border-b border-neutral-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[.8rem] font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === t.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Courses */}
          {tab === "courses" &&
            (coursesLoading ? (
              <TabSpinner />
            ) : courses.length === 0 ? (
              <EmptyState message="No courses enrolled yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                      {course.cover_image ? (
                        <img
                          src={course.cover_image}
                          alt={course.course_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-8 h-8 text-orange-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-neutral-900 text-sm leading-snug mb-1">
                        {course.course_title}
                      </h4>
                      <p className="text-xs text-neutral-500 mb-3">
                        by {course.tutor_name}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-neutral-500">
                          <span>
                            {course.completed_modules}/{course.module_count}{" "}
                            modules
                          </span>
                          <span className="font-semibold text-neutral-700">
                            {Math.round(course.progress_percentage)}%
                          </span>
                        </div>
                        <ProgressBar
                          value={course.progress_percentage}
                          color="orange"
                        />
                      </div>
                      {course.completed_at && (
                        <div className="mt-2">
                          <Badge variant="green">Completed</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* Live Classes */}
          {tab === "live" &&
            (liveLoading ? (
              <TabSpinner />
            ) : liveClasses.length === 0 ? (
              <EmptyState message="No live classes found." />
            ) : (
              <div className="space-y-3">
                {liveClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center gap-4 border border-neutral-100 rounded-2xl p-4"
                  >
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-neutral-900 truncate">
                        {cls.title}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {cls.tutor_name} ·{" "}
                        {new Date(cls.scheduled_at).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        cls.status === "completed"
                          ? "green"
                          : cls.status === "live"
                          ? "amber"
                          : "neutral"
                      }
                    >
                      {cls.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ))}

          {/* Study Guides */}
          {tab === "guides" &&
            (guidesLoading ? (
              <TabSpinner />
            ) : studyGuides.length === 0 ? (
              <EmptyState message="No study guides purchased yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {studyGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="border border-neutral-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center">
                      {guide.cover_image ? (
                        <img
                          src={guide.cover_image}
                          alt={guide.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-violet-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-neutral-900 truncate">
                        {guide.title}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Purchased{" "}
                        {new Date(guide.purchased_at).toLocaleDateString(
                          "en-ZA"
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* Certificates */}
          {tab === "certs" &&
            (certsLoading ? (
              <TabSpinner />
            ) : certs.length === 0 ? (
              <EmptyState message="No certificates earned yet." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {certs.map((cert, idx) => (
                  <div
                    key={cert.id}
                    className={`bg-gradient-to-br ${
                      CERT_GRADIENTS[idx % CERT_GRADIENTS.length]
                    } rounded-2xl p-5 text-white`}
                  >
                    <Award className="w-6 h-6 mb-3 opacity-80" />
                    <p className="font-bold text-base leading-snug mb-1">
                      {cert.course_title}
                    </p>
                    <p className="text-xs opacity-70">
                      {child.first_name} {child.last_name}
                    </p>
                    <p className="text-xs opacity-60 mt-1">
                      Issued{" "}
                      {new Date(cert.issued_at).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {cert.download_url && (
                      <a
                        href={cert.download_url}
                        download
                        className="mt-3 inline-flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ))}

          {/* Activity */}
          {tab === "activity" &&
            (activityLoading ? (
              <TabSpinner />
            ) : activityItems.length === 0 ? (
              <EmptyState message="No activity recorded yet." />
            ) : (
              <ul className="space-y-3">
                {activityItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 border-b border-neutral-50 pb-3 last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-800">{item.message}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(item.created_at).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                    )}
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </div>
    </div>
  );
}
