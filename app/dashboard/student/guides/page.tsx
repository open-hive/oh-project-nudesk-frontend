"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Download, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { PaymentModal } from "@/components/dashboard/payment-modal";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import type { StudyGuide, StudyGuideAccess, PaginatedResponse } from "@/lib/types";

type Tab = "browse" | "my-guides";

export default function StudentGuidesPage() {
  const { tokens } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("browse");

  // Browse state — all published guides
  const [guides, setGuides] = useState<StudyGuide[]>([]);
  const [browsing, setBrowsing] = useState(true);
  const [search, setSearch] = useState("");

  // Accessed state — guides student has unlocked
  const [accessed, setAccessed] = useState<StudyGuideAccess[]>([]);
  const [accessedLoading, setAccessedLoading] = useState(true);

  // Per-guide action loading (slug → loading)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [paymentTarget, setPaymentTarget] = useState<StudyGuide | null>(null);

  const accessedSlugs = useMemo(
    () => new Set(accessed.map((a) => a.guide_slug)),
    [accessed]
  );

  const fetchBrowse = useCallback(async () => {
    setBrowsing(true);
    try {
      const data = await apiFetch<PaginatedResponse<StudyGuide>>("/courses/study-guides/");
      setGuides(data.results);
    } catch {
      toast.error("Failed to load study guides.");
    } finally {
      setBrowsing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAccessed = useCallback(async () => {
    if (!tokens) return;
    setAccessedLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<StudyGuideAccess>>("/students/study-guides/", {
        token: tokens.access,
      });
      setAccessed(data.results);
    } catch {
      toast.error("Failed to load your guides.");
    } finally {
      setAccessedLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useEffect(() => {
    fetchBrowse();
    fetchAccessed();
  }, [fetchBrowse, fetchAccessed]);

  function openFile(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleAccessFree(guide: StudyGuide) {
    if (!tokens) return;
    setActionLoading((p) => ({ ...p, [guide.slug]: true }));
    try {
      const access = await apiFetch<StudyGuideAccess>("/students/study-guides/access/", {
        method: "POST",
        token: tokens.access,
        body: JSON.stringify({ study_guide_slug: guide.slug }),
      });
      setAccessed((prev) => [access, ...prev]);
      toast.success("Guide unlocked!");
      openFile(access.file);
    } catch (e) {
      toast.error(e instanceof ApiError ? String((e.body as Record<string, string>).detail ?? "Failed.") : "Failed.");
    } finally {
      setActionLoading((p) => ({ ...p, [guide.slug]: false }));
    }
  }

  function handleBuyGuide(guide: StudyGuide) {
    setPaymentTarget(guide);
  }

  function handleDownloadAccessed(access: StudyGuideAccess) {
    openFile(access.file);
  }

  const filteredGuides = useMemo(() => {
    if (!search.trim()) return guides;
    const q = search.toLowerCase();
    return guides.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.tutor_name.toLowerCase().includes(q) ||
        g.category_name.toLowerCase().includes(q)
    );
  }, [guides, search]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">Study Guides</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-neutral-200 mb-5">
        {([["browse", "Browse Guides"], ["my-guides", `My Guides${accessed.length ? ` (${accessed.length})` : ""}`]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-[.85rem] font-semibold border-b-2 transition-colors -mb-px ${
              tab === id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {tab === "browse" && (
        <>
          {/* Search */}
          <div className="mb-5">
            <input
              type="text"
              placeholder="Search guides by title, tutor, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white text-neutral-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 placeholder:text-neutral-400"
            />
          </div>

          {browsing ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </div>
          ) : filteredGuides.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
              <p className="text-sm text-neutral-400">
                {search ? "No guides match your search." : "No study guides available yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {filteredGuides.map((g) => {
                const isOwned = accessedSlugs.has(g.slug);
                const isLoading = !!actionLoading[g.slug];
                return (
                  <div
                    key={g.id}
                    className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-5 hover:border-violet-200 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-[10px] bg-violet-50 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-violet-600" />
                      </div>
                      <Badge variant={g.is_free ? "green" : "amber"}>
                        {g.is_free ? "Free" : "Subscription"}
                      </Badge>
                    </div>
                    <div className="text-[.9rem] font-bold mb-1 line-clamp-2">{g.title}</div>
                    <div className="text-[.78rem] text-neutral-500 mb-3 line-clamp-2 flex-1">{g.description}</div>
                    <div className="text-[.75rem] text-neutral-400 mb-4">
                      {g.tutor_name}
                      {g.page_count ? ` · ${g.page_count} pages` : ""}
                      {" · "}
                      <span>{g.category_name}</span>
                    </div>
                    <div className="flex gap-2">
                      {isOwned ? (
                        <Button
                          variant="outline-v"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            const a = accessed.find((x) => x.guide_slug === g.slug);
                            if (a) handleDownloadAccessed(a);
                          }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download
                        </Button>
                      ) : g.is_free ? (
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          loading={isLoading}
                          onClick={() => handleAccessFree(g)}
                        >
                          Access Free
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleBuyGuide(g)}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                          Subscribe to Unlock
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* My Guides Tab */}
      {tab === "my-guides" && (
        accessedLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        ) : accessed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <p className="text-sm text-neutral-400 mb-3">You haven&apos;t accessed any study guides yet.</p>
            <Button variant="primary" size="sm" onClick={() => setTab("browse")}>Browse Guides</Button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {accessed.map((a) => (
              <div
                key={a.id}
                className="bg-white border-[1.5px] border-neutral-200 rounded-2xl p-5 hover:border-violet-200 hover:shadow-md transition-all flex flex-col"
              >
                <div className="w-10 h-10 rounded-[10px] bg-violet-50 flex items-center justify-center mb-3.5">
                  <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
                <div className="text-[.9rem] font-bold mb-1 line-clamp-2">{a.guide_title}</div>
                <div className="text-[.75rem] text-neutral-400 mb-4 flex-1">
                  {a.tutor_name}
                  {a.page_count ? ` · ${a.page_count} pages` : ""}
                </div>
                <Button
                  variant="outline-v"
                  size="sm"
                  onClick={() => handleDownloadAccessed(a)}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Open / Download
                </Button>
              </div>
            ))}
          </div>
        )
      )}

      {paymentTarget && (
        <PaymentModal
          open={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={async () => {
            setPaymentTarget(null);
            if (!tokens) return;
            const slug = paymentTarget.slug;
            try {
              await apiFetch<StudyGuideAccess>("/students/study-guides/access/", {
                method: "POST",
                token: tokens.access,
                body: JSON.stringify({ study_guide_slug: slug }),
              });
              const data = await apiFetch<PaginatedResponse<StudyGuideAccess>>("/students/study-guides/", { token: tokens.access });
              setAccessed(data.results);
              const newAccess = data.results.find((a) => a.guide_slug === slug);
              if (newAccess?.file) openFile(newAccess.file);
              toast.success("Subscription activated and guide unlocked!");
            } catch (e) {
              toast.error(
                e instanceof ApiError
                  ? String((e.body as Record<string, string>).detail ?? "Failed to unlock guide.")
                  : "Failed to unlock guide."
              );
            }
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
