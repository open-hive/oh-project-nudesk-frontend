"use client";

import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalHead, ModalBody, ModalFoot } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { AlertCircle, BookOpen, Check, Edit2, ExternalLink, FileText, HelpCircle, ImageIcon, Loader2, Pencil, Plus, Radio, Trash2, Upload, Video } from "lucide-react";
import Link from "next/link";
import { ScheduleLiveModal } from "@/components/dashboard/schedule-live-modal";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, apiUpload, ApiError } from "@/lib/api";
import type { TutorCourse, TutorStudyGuide, Category, CourseModule, LiveClass, PaginatedResponse, QuizQuestion } from "@/lib/types";

type Tab = "courses" | "live" | "guides";

const statusBadge: Record<string, "green" | "amber" | "neutral" | "red" | "violet"> = {
  published: "green",
  pending_review: "amber",
  draft: "neutral",
  rejected: "red",
};

const statusLabel: Record<string, string> = {
  published: "Published",
  pending_review: "Pending Review",
  draft: "Draft",
  rejected: "Rejected",
};

export default function TutorContentPage() {
  const { tokens } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("courses");

  // Courses state
  const [courses, setCourses] = useState<TutorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState<string | null>(null);

  // Create course modal
  const [createOpen, setCreateOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wizardStep, setWizardStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    is_free: true,
    price: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Cover image for wizard
  const coverImageRef = useRef<HTMLInputElement>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Quiz builder state (nested inside module editor)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizEditorOpen, setQuizEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionSaving, setQuestionSaving] = useState(false);
  // Question form: text, explanation, and 4 answer slots
  const [questionForm, setQuestionForm] = useState({
    text: "",
    explanation: "",
    answers: [
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  });
  const [questionFormErrors, setQuestionFormErrors] = useState<string>("");

  // Live Sessions state
  const [liveSessions, setLiveSessions] = useState<LiveClass[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveFetched, setLiveFetched] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Study Guides state
  const [guides, setGuides] = useState<TutorStudyGuide[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [guidesFetched, setGuidesFetched] = useState(false);
  const [guideCreateOpen, setGuideCreateOpen] = useState(false);
  const [guideSaving, setGuideSaving] = useState(false);
  const [guideDeleteLoading, setGuideDeleteLoading] = useState<string | null>(null);
  // Manage modules state
  const [manageOpen, setManageOpen] = useState(false);
  const [manageCourse, setManageCourse] = useState<TutorCourse | null>(null);
  const [courseModules, setCourseModules] = useState<CourseModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [moduleDeleteLoading, setModuleDeleteLoading] = useState<number | null>(null);

  // Module editor state (nested inside manage modal)
  const [moduleEditorOpen, setModuleEditorOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleSaving, setModuleSaving] = useState(false);
  const moduleFileRef = useRef<HTMLInputElement>(null);
  const [moduleFile, setModuleFile] = useState<File | null>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [draftQuizQuestions, setDraftQuizQuestions] = useState<{ text: string; explanation: string; answers: { text: string; is_correct: boolean }[] }[]>([]);
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    content_types: ["video"] as string[],
    content_url: "",
    duration_minutes: "",
  });
  const [moduleFormErrors, setModuleFormErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [guideForm, setGuideForm] = useState({
    title: "",
    description: "",
    category: "",
    page_count: "",
    is_free: true,
    price: "",
  });
  const [guideFormErrors, setGuideFormErrors] = useState<Record<string, string>>({});
  const [guideFile, setGuideFile] = useState<File | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "courses", label: "Courses" },
    { id: "live", label: "Live Sessions" },
    { id: "guides", label: "Study Guides" },
  ];

  const fetchCourses = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<TutorCourse>>("/courses/my-courses/", {
        token: tokens.access,
      });
      setCourses(data.results);
    } catch {
      toast.error("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const fetchGuides = useCallback(async () => {
    if (!tokens) return;
    setGuidesLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<TutorStudyGuide>>("/courses/my-study-guides/", {
        token: tokens.access,
      });
      setGuides(data.results);
      setGuidesFetched(true);
    } catch {
      toast.error("Failed to load study guides.");
    } finally {
      setGuidesLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  const fetchLiveSessions = useCallback(async () => {
    if (!tokens) return;
    setLiveLoading(true);
    try {
      const data = await apiFetch<PaginatedResponse<LiveClass>>("/courses/my-live-classes/", {
        token: tokens.access,
      });
      setLiveSessions(data.results);
      setLiveFetched(true);
    } catch {
      toast.error("Failed to load live sessions.");
    } finally {
      setLiveLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useEffect(() => {
    if (tab === "live" && !liveFetched) {
      fetchLiveSessions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab === "guides" && !guidesFetched) {
      fetchGuides();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Fetch categories when any create modal opens
  useEffect(() => {
    if (!createOpen && !guideCreateOpen && !scheduleOpen) return;
    apiFetch<PaginatedResponse<Category>>("/courses/categories/")
      .then((d) => setCategories(d.results))
      .catch(() => {});
  }, [createOpen, guideCreateOpen, scheduleOpen]);

  const stepLabels = ["Course Details", "Set Pricing", "Review & Submit"];

  function closeWizard() {
    setWizardStep(1);
    setForm({ title: "", description: "", category: "", is_free: true, price: "" });
    setFormErrors({});
    setCoverImage(null);
    setCoverPreview(null);
    if (coverImageRef.current) coverImageRef.current.value = "";
    setCreateOpen(false);
  }

  function validateStep(step: number): boolean {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!form.title.trim()) errors.title = "Title is required.";
      if (!form.description.trim()) errors.description = "Description is required.";
      if (!form.category) errors.category = "Category is required.";
    } else if (step === 2) {
      if (!form.is_free && (!form.price || Number(form.price) <= 0))
        errors.price = "Price must be greater than 0.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleWizardNext() {
    if (!validateStep(wizardStep)) return;
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
      return;
    }
    await saveCourse();
  }

  async function saveCourse() {
    if (!tokens) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("description", form.description.trim());
      fd.append("category", String(Number(form.category)));
      fd.append("is_free", String(form.is_free));
      fd.append("price", form.is_free ? "0.00" : form.price);
      if (coverImage) fd.append("cover_image", coverImage);
      await apiUpload<TutorCourse>("/courses/my-courses/", fd, { token: tokens.access });
      toast.success("Course created! Add modules to submit for review.");
      closeWizard();
      fetchCourses();
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as Record<string, string[] | string>;
        const firstKey = Object.keys(body)[0];
        const msg = Array.isArray(body[firstKey]) ? body[firstKey][0] : String(body[firstKey] ?? "Something went wrong.");
        toast.error(msg);
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(slug: string) {
    if (!tokens) return;
    setSubmitLoading(slug);
    try {
      await apiFetch(`/courses/my-courses/${slug}/submit/`, {
        method: "POST",
        token: tokens.access,
      });
      toast.success("Course submitted for review!");
      setCourses((prev) =>
        prev.map((c) => (c.slug === slug ? { ...c, status: "pending_review" } : c))
      );
    } catch (e) {
      toast.error(
        e instanceof ApiError ? String((e.body as Record<string, string>).detail ?? "Failed") : "Failed to submit."
      );
    } finally {
      setSubmitLoading(null);
    }
  }

  function closeGuideModal() {
    setGuideForm({ title: "", description: "", category: "", page_count: "", is_free: true, price: "" });
    setGuideFormErrors({});
    setGuideFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setGuideCreateOpen(false);
  }

  function validateGuideForm(): boolean {
    const errors: Record<string, string> = {};
    if (!guideForm.title.trim()) errors.title = "Title is required.";
    if (!guideForm.description.trim()) errors.description = "Description is required.";
    if (!guideForm.category) errors.category = "Category is required.";
    if (!guideFile) errors.file = "Please upload a file for the study guide.";
    if (!guideForm.is_free && (!guideForm.price || Number(guideForm.price) <= 0))
      errors.price = "Price must be greater than 0 for paid guides.";
    setGuideFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateGuide() {
    if (!tokens || !validateGuideForm() || !guideFile) return;
    setGuideSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", guideForm.title.trim());
      fd.append("description", guideForm.description.trim());
      fd.append("category", guideForm.category);
      fd.append("file", guideFile);
      fd.append("is_free", String(guideForm.is_free));
      fd.append("price", guideForm.is_free ? "0.00" : guideForm.price);
      if (guideForm.page_count) fd.append("page_count", guideForm.page_count);

      const guide = await apiUpload<TutorStudyGuide>("/courses/my-study-guides/", fd, {
        token: tokens.access,
      });
      void guide; // response from CreateUpdateSerializer lacks id/category_name; refetch full list
      toast.success("Study guide saved as draft. Submit it for review when ready.");
      setGuidesFetched(false);
      await fetchGuides();
      closeGuideModal();
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as Record<string, string[] | string>;
        const firstKey = Object.keys(body)[0];
        const msg = Array.isArray(body[firstKey]) ? body[firstKey][0] : String(body[firstKey] ?? "Something went wrong.");
        toast.error(msg);
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setGuideSaving(false);
    }
  }

  // ── Manage Modules ────────────────────────────────────────────

  async function openManageCourse(course: TutorCourse) {
    if (!tokens) return;
    setManageCourse(course);
    setManageOpen(true);
    setModulesLoading(true);
    try {
      const data = await apiFetch<CourseModule[]>(`/courses/my-courses/${course.slug}/modules/`, {
        token: tokens.access,
      });
      setCourseModules(Array.isArray(data) ? data : (data as { results?: CourseModule[] }).results ?? []);
    } catch {
      toast.error("Failed to load modules.");
    } finally {
      setModulesLoading(false);
    }
  }

  function closeManageModal() {
    setManageOpen(false);
    setManageCourse(null);
    setCourseModules([]);
    closeModuleEditor();
  }

  function openNewModule() {
    setEditingModule(null);
    setModuleForm({ title: "", description: "", content_types: ["video"], content_url: "", duration_minutes: "" });
    setModuleFormErrors({});
    setModuleFile(null);
    if (moduleFileRef.current) moduleFileRef.current.value = "";
    setVideoFile(null);
    if (videoFileRef.current) videoFileRef.current.value = "";
    setDraftQuizQuestions([]);
    setModuleEditorOpen(true);
  }

  function openEditModule(mod: CourseModule) {
    setEditingModule(mod);
    setModuleForm({
      title: mod.title,
      description: mod.description,
      content_types: mod.content_type ? mod.content_type.split(",").filter(Boolean) : ["video"],
      content_url: mod.content_url,
      duration_minutes: mod.duration_minutes && mod.duration_minutes > 0 ? String(mod.duration_minutes) : "",
    });
    setModuleFormErrors({});
    setModuleFile(null);
    if (moduleFileRef.current) moduleFileRef.current.value = "";
    setVideoFile(null);
    if (videoFileRef.current) videoFileRef.current.value = "";
    setDraftQuizQuestions([]);
    if (mod.content_type.includes("quiz") && tokens && manageCourse) {
      setQuizLoading(true);
      apiFetch<QuizQuestion[]>(`/courses/my-courses/${manageCourse.slug}/modules/${mod.id}/quiz/`, { token: tokens.access })
        .then((qs) => setQuizQuestions(qs))
        .catch(() => setQuizQuestions([]))
        .finally(() => setQuizLoading(false));
    }
    setModuleEditorOpen(true);
  }

  function closeModuleEditor() {
    setModuleEditorOpen(false);
    setEditingModule(null);
    setModuleFile(null);
    if (moduleFileRef.current) moduleFileRef.current.value = "";
    setVideoFile(null);
    if (videoFileRef.current) videoFileRef.current.value = "";
    setModuleFormErrors({});
    setQuizQuestions([]);
    setDraftQuizQuestions([]);
    setQuizEditorOpen(false);
    setEditingQuestion(null);
  }

  function validateModuleForm(): boolean {
    const errors: Record<string, string> = {};
    if (!moduleForm.title.trim()) errors.title = "Title is required.";
    if (moduleForm.content_types.includes("video") && !moduleForm.content_url.trim() && !videoFile)
      errors.content_url = "Provide a video URL or upload an MP4 file.";
    if (moduleForm.content_types.includes("document") && !editingModule && !moduleFile)
      errors.file = "Please upload a file for this module.";
    setModuleFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openQuestionEditor(q?: QuizQuestion) {
    setEditingQuestion(q ?? null);
    setQuestionFormErrors("");
    if (q) {
      const base = q.answers.slice(0, 4).map((a) => ({ text: a.text, is_correct: a.is_correct ?? false }));
      while (base.length < 4) base.push({ text: "", is_correct: false });
      setQuestionForm({ text: q.text, explanation: q.explanation, answers: base });
    } else {
      setQuestionForm({
        text: "",
        explanation: "",
        answers: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      });
    }
    setQuizEditorOpen(true);
  }

  async function handleSaveQuestion() {
    if (!tokens || !manageCourse) return;
    setQuestionFormErrors("");
    const filledAnswers = questionForm.answers.filter((a) => a.text.trim());
    if (!questionForm.text.trim()) { setQuestionFormErrors("Question text is required."); return; }
    if (filledAnswers.length < 2) { setQuestionFormErrors("At least 2 answer choices are required."); return; }
    const correctCount = filledAnswers.filter((a) => a.is_correct).length;
    if (correctCount !== 1) { setQuestionFormErrors("Exactly one answer must be marked as correct."); return; }

    // New module (not yet saved) — store as draft
    if (!editingModule) {
      const draft = {
        text: questionForm.text.trim(),
        explanation: questionForm.explanation.trim(),
        answers: filledAnswers.map((a) => ({ text: a.text.trim(), is_correct: a.is_correct })),
      };
      if (editingQuestion) {
        // editingQuestion here holds a draft index stored in id field as negative
        setDraftQuizQuestions((prev) => prev.map((q, i) => i === -(editingQuestion.id + 1) ? draft : q));
      } else {
        setDraftQuizQuestions((prev) => [...prev, draft]);
      }
      setQuizEditorOpen(false);
      setEditingQuestion(null);
      return;
    }

    setQuestionSaving(true);
    try {
      const payload = {
        text: questionForm.text.trim(),
        explanation: questionForm.explanation.trim(),
        order: editingQuestion ? editingQuestion.order : quizQuestions.length + 1,
        answers: filledAnswers.map((a, i) => ({ text: a.text.trim(), is_correct: a.is_correct, order: i + 1 })),
      };
      if (editingQuestion) {
        const updated = await apiFetch<QuizQuestion>(
          `/courses/my-courses/${manageCourse.slug}/modules/${editingModule.id}/quiz/${editingQuestion.id}/`,
          { method: "PATCH", token: tokens.access, body: JSON.stringify(payload) }
        );
        setQuizQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        toast.success("Question updated!");
      } else {
        const created = await apiFetch<QuizQuestion>(
          `/courses/my-courses/${manageCourse.slug}/modules/${editingModule.id}/quiz/`,
          { method: "POST", token: tokens.access, body: JSON.stringify(payload) }
        );
        setQuizQuestions((prev) => [...prev, created]);
        toast.success("Question added!");
      }
      setQuizEditorOpen(false);
      setEditingQuestion(null);
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as Record<string, string[] | string>;
        const firstKey = Object.keys(body)[0];
        const msg = Array.isArray(body[firstKey]) ? body[firstKey][0] : String(body[firstKey] ?? "Something went wrong.");
        setQuestionFormErrors(msg);
      } else {
        setQuestionFormErrors("Something went wrong.");
      }
    } finally {
      setQuestionSaving(false);
    }
  }

  async function handleDeleteQuestion(qId: number) {
    if (!tokens || !manageCourse || !editingModule) return;
    try {
      await apiFetch(`/courses/my-courses/${manageCourse.slug}/modules/${editingModule.id}/quiz/${qId}/`, {
        method: "DELETE",
        token: tokens.access,
      });
      setQuizQuestions((prev) => prev.filter((q) => q.id !== qId));
      toast.success("Question deleted.");
    } catch {
      toast.error("Failed to delete question.");
    }
  }

  async function handleSaveModule() {
    if (!tokens || !manageCourse || !validateModuleForm()) return;
    setModuleSaving(true);
    try {
      const isEdit = !!editingModule;
      const nextOrder = courseModules.length + 1;

      let saved: CourseModule;
      const contentTypeStr = moduleForm.content_types.join(",");
      const needsFormData = (moduleForm.content_types.includes("document") && (moduleFile || isEdit)) ||
                            (moduleForm.content_types.includes("video") && videoFile);

      if (needsFormData) {
        const fd = new FormData();
        fd.append("title", moduleForm.title.trim());
        fd.append("description", moduleForm.description.trim());
        fd.append("content_type", contentTypeStr);
        if (moduleForm.content_url.trim()) fd.append("content_url", moduleForm.content_url.trim());
        if (moduleForm.duration_minutes) fd.append("duration_minutes", moduleForm.duration_minutes);
        if (!isEdit) fd.append("order", String(nextOrder));
        if (moduleFile) fd.append("file", moduleFile);
        if (videoFile) fd.append("file", videoFile);
        saved = await apiUpload<CourseModule>(
          isEdit
            ? `/courses/my-courses/${manageCourse.slug}/modules/${editingModule!.id}/`
            : `/courses/my-courses/${manageCourse.slug}/modules/`,
          fd,
          { token: tokens.access, method: isEdit ? "PATCH" : "POST" }
        );
      } else {
        saved = await apiFetch<CourseModule>(
          isEdit
            ? `/courses/my-courses/${manageCourse.slug}/modules/${editingModule!.id}/`
            : `/courses/my-courses/${manageCourse.slug}/modules/`,
          {
            method: isEdit ? "PATCH" : "POST",
            token: tokens.access,
            body: JSON.stringify({
              title: moduleForm.title.trim(),
              description: moduleForm.description.trim(),
              content_type: contentTypeStr,
              content_url: moduleForm.content_url.trim(),
              duration_minutes: moduleForm.duration_minutes ? Number(moduleForm.duration_minutes) : 0,
              ...(isEdit ? {} : { order: nextOrder }),
            }),
          }
        );
      }

      // Save draft quiz questions for new quiz modules
      if (!isEdit && moduleForm.content_types.includes("quiz") && draftQuizQuestions.length > 0) {
        for (let i = 0; i < draftQuizQuestions.length; i++) {
          const dq = draftQuizQuestions[i];
          await apiFetch(`/courses/my-courses/${manageCourse.slug}/modules/${saved.id}/quiz/`, {
            method: "POST",
            token: tokens.access,
            body: JSON.stringify({
              text: dq.text,
              explanation: dq.explanation,
              order: i + 1,
              answers: dq.answers.map((a, j) => ({ text: a.text, is_correct: a.is_correct, order: j + 1 })),
            }),
          });
        }
      }

      if (isEdit) {
        setCourseModules((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
      } else {
        setCourseModules((prev) => [...prev, saved]);
        // bump module_count on parent list
        setCourses((prev) => prev.map((c) => c.slug === manageCourse.slug ? { ...c, module_count: c.module_count + 1 } : c));
      }
      toast.success(isEdit ? "Module updated!" : "Module added!");
      closeModuleEditor();
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as Record<string, string[] | string>;
        const firstKey = Object.keys(body)[0];
        const msg = Array.isArray(body[firstKey]) ? body[firstKey][0] : String(body[firstKey] ?? "Something went wrong.");
        toast.error(msg);
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setModuleSaving(false);
    }
  }

  async function handleDeleteModule(id: number) {
    if (!tokens || !manageCourse) return;
    if (!window.confirm("Delete this module? This cannot be undone.")) return;
    setModuleDeleteLoading(id);
    try {
      await apiFetch(`/courses/my-courses/${manageCourse.slug}/modules/${id}/`, {
        method: "DELETE",
        token: tokens.access,
      });
      setCourseModules((prev) => prev.filter((m) => m.id !== id));
      setCourses((prev) => prev.map((c) => c.slug === manageCourse.slug ? { ...c, module_count: Math.max(0, c.module_count - 1) } : c));
      toast.success("Module deleted.");
    } catch {
      toast.error("Failed to delete module.");
    } finally {
      setModuleDeleteLoading(null);
    }
  }

  async function handleSubmitGuide(slug: string) {
    if (!tokens) return;
    setSubmitLoading(slug);
    try {
      await apiFetch(`/courses/my-study-guides/${slug}/submit/`, {
        method: "POST",
        token: tokens.access,
      });
      toast.success("Study guide submitted for review!");
      setGuides((prev) =>
        prev.map((g) => (g.slug === slug ? { ...g, status: "pending_review" } : g))
      );
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? String((e.body as Record<string, string>).detail ?? "Failed to submit.")
          : "Failed to submit."
      );
    } finally {
      setSubmitLoading(null);
    }
  }

  async function handleDeleteGuide(slug: string, title: string) {
    if (!tokens) return;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setGuideDeleteLoading(slug);
    try {
      await apiFetch(`/courses/my-study-guides/${slug}/`, {
        method: "DELETE",
        token: tokens.access,
      });
      toast.success("Study guide deleted.");
      setGuides((prev) => prev.filter((g) => g.slug !== slug));
    } catch {
      toast.error("Failed to delete study guide.");
    } finally {
      setGuideDeleteLoading(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-[1.3rem] font-extrabold tracking-[-0.02em]">My Content</h2>
        <div className="flex gap-2">
          {tab === "courses" && (
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              + New Course
            </Button>
          )}
          {tab === "live" && (
            <Button variant="primary" size="sm" onClick={() => setScheduleOpen(true)}>
              + Schedule Session
            </Button>
          )}
          {tab === "guides" && (
            <Button variant="primary" size="sm" onClick={() => setGuideCreateOpen(true)}>
              + New Guide
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-neutral-200 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[.85rem] font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Courses Tab */}
      {tab === "courses" && (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <p className="text-sm text-neutral-400">No courses yet. Create your first course!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Course</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Category</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Modules</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Price</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="text-[.875rem] font-semibold">{c.title}</div>
                      {c.average_rating != null && (
                        <span className="text-[.75rem] text-amber-500 font-bold">{c.average_rating.toFixed(1)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="violet">{c.category_name}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[.82rem]">{c.module_count} modules</td>
                    <td className="px-4 py-3 text-[.82rem] font-semibold">
                      {c.is_free ? "Free" : `P${c.price}`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[c.status] ?? "neutral"}>
                        {statusLabel[c.status] ?? c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openManageCourse(c)}
                        >
                          Manage
                        </Button>
                        {(c.status === "draft" || c.status === "rejected") && (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={submitLoading === c.slug}
                            onClick={() => handleSubmit(c.slug)}
                          >
                            Submit
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Live Sessions Tab */}
      {tab === "live" && (
        liveLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        ) : (
          <>
            {/* Live now banner */}
            {liveSessions.some((s) => s.status === "live") && (
              <div
                className="rounded-2xl p-5 mb-4 flex items-center justify-between flex-wrap gap-4"
                style={{ background: "linear-gradient(135deg, var(--color-violet-600), var(--color-violet-900))" }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 text-[.7rem] font-bold text-red-300 bg-red-500/20 border border-red-500/30 rounded-full px-2.5 py-0.5">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                      LIVE NOW
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {liveSessions.find((s) => s.status === "live")?.title}
                  </div>
                  <div className="text-[.78rem] text-white/60 mt-0.5">
                    {liveSessions.find((s) => s.status === "live")?.registered_count} students attending
                  </div>
                </div>
                <Link href="/dashboard/tutor/live">
                  <Button variant="accent" size="sm">
                    <Radio className="w-3.5 h-3.5" />
                    Manage Session
                  </Button>
                </Link>
              </div>
            )}

            {liveSessions.filter((s) => s.status !== "completed" && s.status !== "cancelled").length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center">
                <AlertCircle className="w-7 h-7 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-500 mb-1">No live classes scheduled</p>
                <p className="text-xs text-neutral-400">Click &quot;Schedule Session&quot; to create your first live class.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Session</th>
                      <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Date &amp; Time</th>
                      <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Registered</th>
                      <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveSessions
                      .filter((s) => s.status !== "completed" && s.status !== "cancelled")
                      .map((s) => (
                        <tr key={s.id} className="border-b border-neutral-100 last:border-b-0">
                          <td className="px-4 py-3 text-[.875rem] font-semibold">{s.title}</td>
                          <td className="px-4 py-3 text-[.82rem]">
                            {new Date(s.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {" "}&middot;{" "}{s.start_time?.slice(0, 5)}
                          </td>
                          <td className="px-4 py-3 text-[.82rem]">{s.registered_count}</td>
                          <td className="px-4 py-3">
                            {s.status === "live" ? (
                              <Badge variant="red">
                                <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse mr-1" />
                                Live
                              </Badge>
                            ) : (
                              <Badge variant="violet">Scheduled</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Link href="/dashboard/tutor/live">
                              <Button variant={s.status === "live" ? "primary" : "secondary"} size="sm">
                                {s.status === "live" ? "Manage" : "Start / Edit"}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      )}

      {/* Guides Tab */}
      {tab === "guides" && (
        guidesLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        ) : guides.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
            <p className="text-sm text-neutral-400">No study guides yet. Upload your first guide!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Title</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Category</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Pages</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Price</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-4 py-3 text-[.72rem] font-bold uppercase tracking-wider text-neutral-500">Downloads</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {guides.map((g) => (
                  <tr key={g.id} className="border-b border-neutral-100 last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="text-[.875rem] font-semibold">{g.title}</div>
                      <div className="text-[.75rem] text-neutral-400 line-clamp-1">{g.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="violet">{g.category_name}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[.82rem]">{g.page_count || "—"}</td>
                    <td className="px-4 py-3 text-[.82rem] font-semibold">
                      {g.is_free ? "Free" : `P${g.price}`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[g.status] ?? "neutral"}>
                        {statusLabel[g.status] ?? g.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[.82rem] text-neutral-500">{g.download_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(g.status === "draft" || g.status === "rejected") && (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={submitLoading === g.slug}
                            onClick={() => handleSubmitGuide(g.slug)}
                          >
                            Submit
                          </Button>
                        )}
                        <button
                          onClick={() => handleDeleteGuide(g.slug, g.title)}
                          disabled={guideDeleteLoading === g.slug}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Create Guide Modal */}
      <Modal open={guideCreateOpen} onClose={closeGuideModal} size="lg">
        <ModalHead title="Upload Study Guide" subtitle="Saved as draft — submit for admin review when ready" onClose={closeGuideModal} />
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
              <Input
                placeholder="e.g. Introduction to Linear Algebra — Complete Notes"
                value={guideForm.title}
                error={!!guideFormErrors.title}
                onChange={(e) => { setGuideForm({ ...guideForm, title: e.target.value }); setGuideFormErrors((p) => ({ ...p, title: "" })); }}
              />
              {guideFormErrors.title && <p className="text-xs text-red-500 mt-1">{guideFormErrors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
              <select
                className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white text-neutral-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                value={guideForm.category}
                onChange={(e) => { setGuideForm({ ...guideForm, category: e.target.value }); setGuideFormErrors((p) => ({ ...p, category: "" })); }}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {guideFormErrors.category && <p className="text-xs text-red-500 mt-1">{guideFormErrors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <textarea
                className="w-full h-20 p-3 text-sm border-[1.5px] border-neutral-200 rounded-xl bg-white resize-none focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                placeholder="Brief description of what this guide covers…"
                value={guideForm.description}
                onChange={(e) => { setGuideForm({ ...guideForm, description: e.target.value }); setGuideFormErrors((p) => ({ ...p, description: "" })); }}
              />
              {guideFormErrors.description && <p className="text-xs text-red-500 mt-1">{guideFormErrors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                File <span className="text-neutral-400 font-normal">(PDF, DOCX, etc.)</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
                  guideFormErrors.file ? "border-red-400 bg-red-50" : "border-neutral-200 bg-neutral-50 hover:border-violet-400 hover:bg-violet-50"
                }`}
              >
                <Upload className="w-6 h-6 text-neutral-400" />
                {guideFile ? (
                  <span className="text-sm font-semibold text-violet-700">{guideFile.name}</span>
                ) : (
                  <span className="text-sm text-neutral-500">Click to select a file</span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setGuideFile(f);
                    setGuideFormErrors((p) => ({ ...p, file: "" }));
                  }}
                />
              </div>
              {guideFormErrors.file && <p className="text-xs text-red-500 mt-1">{guideFormErrors.file}</p>}
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Page Count <span className="text-neutral-400 font-normal">(optional)</span></label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 42"
                  value={guideForm.page_count}
                  onChange={(e) => setGuideForm({ ...guideForm, page_count: e.target.value })}
                />
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer pb-2.5">
                  <input
                    type="checkbox"
                    checked={guideForm.is_free}
                    onChange={(e) => setGuideForm({ ...guideForm, is_free: e.target.checked, price: e.target.checked ? "" : guideForm.price })}
                    className="w-4 h-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
                  />
                  Free guide
                </label>
              </div>
            </div>

            {!guideForm.is_free && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Price (BWP)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">P</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="9.99"
                    value={guideForm.price}
                    onChange={(e) => { setGuideForm({ ...guideForm, price: e.target.value }); setGuideFormErrors((p) => ({ ...p, price: "" })); }}
                    className="w-full pl-8 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white text-neutral-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                  />
                </div>
                {guideFormErrors.price && <p className="text-xs text-red-500 mt-1">{guideFormErrors.price}</p>}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFoot>
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" disabled={guideSaving} onClick={closeGuideModal}>Cancel</Button>
            <Button variant="primary" size="sm" loading={guideSaving} onClick={handleCreateGuide}>
              Publish Guide
            </Button>
          </div>
        </ModalFoot>
      </Modal>

      {/* ── Manage Modules Modal ─────────────────────────────── */}
      <Modal open={manageOpen} onClose={closeManageModal} size="lg">
        <ModalHead
          title={`Modules — ${manageCourse?.title ?? ""}`}
          subtitle={`${courseModules.length} module${courseModules.length !== 1 ? "s" : ""}`}
          onClose={closeManageModal}
        />
        <ModalBody>
          {modulesLoading ? (
            <div className="flex items-center justify-center py-10">
              <svg className="animate-spin w-5 h-5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {courseModules.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-6">No modules yet. Add your first module below.</p>
              ) : (
                courseModules.map((mod, i) => {
                  const types = mod.content_type ? mod.content_type.split(",").filter(Boolean) : ["video"];
                  const typeIconMap: Record<string, React.ReactNode> = {
                    video: <Video className="w-3 h-3" />,
                    document: <FileText className="w-3 h-3" />,
                    quiz: <HelpCircle className="w-3 h-3" />,
                    reading: <BookOpen className="w-3 h-3" />,
                  };
                  return (
                    <div key={mod.id} className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                      <span className="text-xs font-bold text-neutral-400 mt-0.5 w-5 shrink-0">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{mod.title}</div>
                        <div className="flex items-center gap-2 text-[.72rem] text-neutral-400 mt-0.5 flex-wrap">
                          {types.map((t) => (
                            <span key={t} className="flex items-center gap-1 capitalize">
                              {typeIconMap[t] ?? <BookOpen className="w-3 h-3" />}{t}
                            </span>
                          ))}
                          {mod.duration_minutes && mod.duration_minutes > 0 && (
                            <span>· {mod.duration_minutes} min</span>
                          )}
                          {mod.content_url && (
                            <span className="text-violet-500 truncate max-w-[180px]">{mod.content_url}</span>
                          )}
                          {mod.file && (
                            <span className="text-green-600">File attached</span>
                          )}
                        </div>
                        {mod.description && (
                          <p className="text-[.75rem] text-neutral-500 mt-1 line-clamp-2">{mod.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 mt-0.5">
                        <button
                          onClick={() => openEditModule(mod)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                          title="Edit module"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod.id)}
                          disabled={moduleDeleteLoading === mod.id}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete module"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </ModalBody>
        <ModalFoot>
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="sm" onClick={closeManageModal}>Close</Button>
            <Button variant="primary" size="sm" onClick={openNewModule}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Module
            </Button>
          </div>
        </ModalFoot>
      </Modal>

      {/* ── Module Editor Modal ───────────────────────────────── */}
      <Modal open={moduleEditorOpen} onClose={closeModuleEditor} size="md">
        <ModalHead
          title={editingModule ? "Edit Module" : "Add Module"}
          subtitle={manageCourse?.title ?? ""}
          onClose={closeModuleEditor}
        />
        <ModalBody>
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
              <Input
                placeholder="e.g. Introduction to Derivatives"
                value={moduleForm.title}
                error={!!moduleFormErrors.title}
                onChange={(e) => { setModuleForm({ ...moduleForm, title: e.target.value }); setModuleFormErrors((p) => ({ ...p, title: "" })); }}
              />
              {moduleFormErrors.title && <p className="text-xs text-red-500 mt-1">{moduleFormErrors.title}</p>}
            </div>

            {/* Content Types — multi-select */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Content Type <span className="text-neutral-400 font-normal">(select all that apply)</span></label>
              <div className="flex gap-2">
                {(["video", "reading", "document", "quiz"] as const).map((ct) => {
                  const Icon = ct === "video" ? Video : ct === "document" ? FileText : ct === "quiz" ? HelpCircle : BookOpen;
                  const labels: Record<string, string> = { video: "Video", reading: "Reading", document: "Document", quiz: "Quiz" };
                  const isActive = moduleForm.content_types.includes(ct);
                  return (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => {
                        const next = isActive
                          ? moduleForm.content_types.filter((t) => t !== ct)
                          : [...moduleForm.content_types, ct];
                        if (next.length === 0) return; // must keep at least one
                        setModuleForm({ ...moduleForm, content_types: next });
                        if (ct === "quiz" && !isActive && editingModule && tokens && manageCourse && quizQuestions.length === 0) {
                          setQuizLoading(true);
                          apiFetch<QuizQuestion[]>(`/courses/my-courses/${manageCourse.slug}/modules/${editingModule.id}/quiz/`, { token: tokens.access })
                            .then((qs) => setQuizQuestions(qs))
                            .catch(() => setQuizQuestions([]))
                            .finally(() => setQuizLoading(false));
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border-[1.5px] text-sm font-semibold transition-colors ${
                        isActive
                          ? "border-violet-600 bg-violet-50 text-violet-700"
                          : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {labels[ct]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video: URL + optional MP4 upload */}
            {moduleForm.content_types.includes("video") && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Video URL <span className="text-neutral-400 font-normal">(YouTube, Vimeo, or direct link)</span>
                  </label>
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={moduleForm.content_url}
                    error={!!moduleFormErrors.content_url}
                    onChange={(e) => { setModuleForm({ ...moduleForm, content_url: e.target.value }); setModuleFormErrors((p) => ({ ...p, content_url: "" })); }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-neutral-200" />
                  <span className="text-xs text-neutral-400 font-medium">or upload MP4</span>
                  <div className="flex-1 h-px bg-neutral-200" />
                </div>
                <div>
                  <div
                    onClick={() => videoFileRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${
                      moduleFormErrors.content_url ? "border-red-400 bg-red-50" : "border-neutral-200 bg-neutral-50 hover:border-violet-400 hover:bg-violet-50"
                    }`}
                  >
                    <Upload className="w-5 h-5 text-neutral-400" />
                    {videoFile ? (
                      <span className="text-sm font-semibold text-violet-700">{videoFile.name}</span>
                    ) : editingModule?.file && !videoFile ? (
                      <span className="text-sm text-green-600">Current video attached — click to replace</span>
                    ) : (
                      <span className="text-sm text-neutral-500">Click to select an MP4 file</span>
                    )}
                    <input
                      ref={videoFileRef}
                      type="file"
                      accept="video/mp4,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setVideoFile(f);
                        setModuleFormErrors((p) => ({ ...p, content_url: "" }));
                      }}
                    />
                  </div>
                  {moduleFormErrors.content_url && <p className="text-xs text-red-500 mt-1">{moduleFormErrors.content_url}</p>}
                </div>
              </div>
            )}

            {/* Reading URL */}
            {moduleForm.content_types.includes("reading") && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  External Link <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/article"
                  value={moduleForm.content_url}
                  onChange={(e) => setModuleForm({ ...moduleForm, content_url: e.target.value })}
                />
              </div>
            )}

            {/* Document file upload */}
            {moduleForm.content_types.includes("document") && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  File <span className="text-neutral-400 font-normal">(PDF, DOCX, PPTX, etc.)</span>
                  {editingModule?.file && !moduleFile && (
                    <span className="ml-2 text-[.72rem] text-green-600">Current file attached — upload a new one to replace</span>
                  )}
                </label>
                <div
                  onClick={() => moduleFileRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${
                    moduleFormErrors.file ? "border-red-400 bg-red-50" : "border-neutral-200 bg-neutral-50 hover:border-violet-400 hover:bg-violet-50"
                  }`}
                >
                  <Upload className="w-5 h-5 text-neutral-400" />
                  {moduleFile ? (
                    <span className="text-sm font-semibold text-violet-700">{moduleFile.name}</span>
                  ) : (
                    <span className="text-sm text-neutral-500">Click to select a file</span>
                  )}
                  <input
                    ref={moduleFileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setModuleFile(f);
                      setModuleFormErrors((p) => ({ ...p, file: "" }));
                    }}
                  />
                </div>
                {moduleFormErrors.file && <p className="text-xs text-red-500 mt-1">{moduleFormErrors.file}</p>}
              </div>
            )}

            {/* Quiz questions builder */}
            {moduleForm.content_types.includes("quiz") && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">Questions</label>
                  <button
                    type="button"
                    onClick={() => openQuestionEditor()}
                    className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
                  >
                    <Plus className="w-3 h-3" /> Add Question
                  </button>
                </div>
                {quizLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  </div>
                ) : editingModule ? (
                  quizQuestions.length === 0 ? (
                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl p-5 text-center">
                      <HelpCircle className="w-6 h-6 text-neutral-300 mx-auto mb-1" />
                      <p className="text-sm text-neutral-400">No questions yet.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {quizQuestions.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
                          <span className="mt-0.5 text-xs font-bold text-neutral-400 shrink-0">Q{i + 1}</span>
                          <p className="flex-1 text-sm text-neutral-800 line-clamp-2">{q.text}</p>
                          <span className="text-xs text-neutral-400 shrink-0">{q.answers.length} opts</span>
                          <button
                            type="button"
                            onClick={() => openQuestionEditor(q)}
                            className="p-1 text-neutral-400 hover:text-violet-600 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                ) : draftQuizQuestions.length === 0 ? (
                  <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl p-5 text-center">
                    <HelpCircle className="w-6 h-6 text-neutral-300 mx-auto mb-1" />
                    <p className="text-sm text-neutral-400">No questions yet. Add some above.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {draftQuizQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
                        <span className="mt-0.5 text-xs font-bold text-neutral-400 shrink-0">Q{i + 1}</span>
                        <p className="flex-1 text-sm text-neutral-800 line-clamp-2">{q.text}</p>
                        <span className="text-xs text-neutral-400 shrink-0">{q.answers.filter(a => a.text).length} opts</span>
                        <button
                          type="button"
                          onClick={() => {
                            const base = q.answers.slice(0, 4).map((a) => ({ text: a.text, is_correct: a.is_correct }));
                            while (base.length < 4) base.push({ text: "", is_correct: false });
                            setQuestionForm({ text: q.text, explanation: q.explanation, answers: base });
                            setQuestionFormErrors("");
                            // use negative index as fake id to identify draft
                            setEditingQuestion({ id: -(i + 1), text: q.text, explanation: q.explanation, order: i + 1, answers: q.answers.map((a, j) => ({ id: j, text: a.text, is_correct: a.is_correct, order: j })) });
                            setQuizEditorOpen(true);
                          }}
                          className="p-1 text-neutral-400 hover:text-violet-600 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraftQuizQuestions((prev) => prev.filter((_, j) => j !== i))}
                          className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full h-20 p-3 text-sm border-[1.5px] border-neutral-200 rounded-xl bg-white resize-none focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                placeholder="What will students learn in this module?"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Duration <span className="text-neutral-400 font-normal">(minutes, optional)</span>
              </label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 15"
                value={moduleForm.duration_minutes}
                onChange={(e) => setModuleForm({ ...moduleForm, duration_minutes: e.target.value })}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFoot>
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" disabled={moduleSaving} onClick={closeModuleEditor}>Cancel</Button>
            <Button variant="primary" size="sm" loading={moduleSaving} onClick={handleSaveModule}>
              {editingModule ? "Save Changes" : "Add Module"}
            </Button>
          </div>
        </ModalFoot>
      </Modal>

      {/* Quiz Question Editor Modal */}
      <Modal open={quizEditorOpen} onClose={() => { setQuizEditorOpen(false); setEditingQuestion(null); }} size="md">
        <ModalHead
          title={editingQuestion ? "Edit Question" : "Add Question"}
          subtitle={editingModule?.title ?? ""}
          onClose={() => { setQuizEditorOpen(false); setEditingQuestion(null); }}
        />
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Question</label>
              <textarea
                className="w-full h-20 p-3 text-sm border-[1.5px] border-neutral-200 rounded-xl bg-white resize-none focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                placeholder="Enter the question text…"
                value={questionForm.text}
                onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Explanation <span className="text-neutral-400 font-normal">(shown after submission)</span>
              </label>
              <textarea
                className="w-full h-16 p-3 text-sm border-[1.5px] border-neutral-200 rounded-xl bg-white resize-none focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                placeholder="Why is the correct answer correct? (optional)"
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Answer Choices</label>
              <div className="flex flex-col gap-2">
                {questionForm.answers.map((ans, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={ans.is_correct}
                      onChange={() => setQuestionForm({
                        ...questionForm,
                        answers: questionForm.answers.map((a, j) => ({ ...a, is_correct: j === i })),
                      })}
                      className="w-4 h-4 text-violet-600 border-neutral-300 focus:ring-violet-500 shrink-0"
                      title="Mark as correct"
                    />
                    <input
                      className={`flex-1 px-3 py-2 text-sm border-[1.5px] rounded-[10px] bg-white outline-none transition-colors focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10 ${
                        ans.is_correct ? "border-violet-400 bg-violet-50" : "border-neutral-200"
                      }`}
                      placeholder={`Choice ${i + 1}`}
                      value={ans.text}
                      onChange={(e) => setQuestionForm({
                        ...questionForm,
                        answers: questionForm.answers.map((a, j) => j === i ? { ...a, text: e.target.value } : a),
                      })}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-1.5">Select the radio button next to the correct answer.</p>
            </div>
            {questionFormErrors && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{questionFormErrors}</p>
            )}
          </div>
        </ModalBody>
        <ModalFoot>
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" disabled={questionSaving} onClick={() => { setQuizEditorOpen(false); setEditingQuestion(null); }}>Cancel</Button>
            <Button variant="primary" size="sm" loading={questionSaving} onClick={handleSaveQuestion}>
              {editingQuestion ? "Save Changes" : "Add Question"}
            </Button>
          </div>
        </ModalFoot>
      </Modal>

      {/* Create Course Wizard */}
      <Modal open={createOpen} onClose={closeWizard} size="lg">
        <ModalHead
          title="Create New Course"
          subtitle={`Step ${wizardStep} of 3 — ${stepLabels[wizardStep - 1]}`}
          onClose={closeWizard}
        />
        <ModalBody>
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6 px-2">
            {(["Details", "Pricing", "Publish"] as const).map((label, i) => {
              const num = i + 1;
              const done = wizardStep > num;
              const active = wizardStep === num;
              return (
                <Fragment key={label}>
                  {i > 0 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded ${done ? "bg-violet-600" : "bg-neutral-200"}`} />
                  )}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      done || active ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-400"
                    }`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : num}
                    </div>
                    <span className={`text-[.7rem] font-semibold ${
                      done || active ? "text-violet-600" : "text-neutral-400"
                    }`}>{label}</span>
                  </div>
                </Fragment>
              );
            })}
          </div>

          {/* Step 1: Details */}
          {wizardStep === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Course Title</label>
                <Input
                  placeholder="e.g. Introduction to Linear Algebra"
                  value={form.title}
                  error={!!formErrors.title}
                  onChange={(e) => { setForm({ ...form, title: e.target.value }); setFormErrors((p) => ({ ...p, title: "" })); }}
                />
                {formErrors.title && <p className="text-xs text-red-500 mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                <select
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white text-neutral-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                  value={form.category}
                  onChange={(e) => { setForm({ ...form, category: e.target.value }); setFormErrors((p) => ({ ...p, category: "" })); }}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {formErrors.category && <p className="text-xs text-red-500 mt-1">{formErrors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                <textarea
                  className="w-full h-24 p-3 text-sm border-[1.5px] border-neutral-200 rounded-xl bg-white resize-none focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                  placeholder="What will students learn from this course?"
                  value={form.description}
                  onChange={(e) => { setForm({ ...form, description: e.target.value }); setFormErrors((p) => ({ ...p, description: "" })); }}
                />
                {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
              </div>
              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Thumbnail <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <div
                  onClick={() => coverImageRef.current?.click()}
                  className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-200 rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-violet-400 hover:bg-violet-50 bg-neutral-50"
                  style={{ minHeight: "8rem" }}
                >
                  {coverPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="Thumbnail preview" className="w-full h-32 object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-neutral-300" />
                      <span className="text-sm text-neutral-400">Click to upload a cover image</span>
                      <span className="text-xs text-neutral-300">JPG, PNG, WEBP — recommended 1280×720</span>
                    </>
                  )}
                  <input
                    ref={coverImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setCoverImage(f);
                      setCoverPreview(f ? URL.createObjectURL(f) : null);
                    }}
                  />
                </div>
                {coverPreview && (
                  <button
                    type="button"
                    onClick={() => { setCoverImage(null); setCoverPreview(null); if (coverImageRef.current) coverImageRef.current.value = ""; }}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    Remove thumbnail
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {wizardStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_free}
                    onChange={(e) => setForm({ ...form, is_free: e.target.checked, price: e.target.checked ? "" : form.price })}
                    className="w-4 h-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
                  />
                  Free course
                </label>
              </div>
              {!form.is_free && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Price (BWP)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">P</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="49.00"
                        value={form.price}
                        onChange={(e) => { setForm({ ...form, price: e.target.value }); setFormErrors((p) => ({ ...p, price: "" })); }}
                        className="w-full pl-8 pr-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white text-neutral-900 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10"
                      />
                    </div>
                    {formErrors.price && <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>}
                  </div>
                  {form.price && Number(form.price) > 0 && (
                    <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-neutral-700 mb-1">Your estimated share (90%)</p>
                      <p className="text-2xl font-extrabold text-violet-600">
                        P{(Number(form.price) * 0.9).toFixed(2)}{" "}
                        <span className="text-sm font-medium text-neutral-500">per sale</span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Review & Publish */}
          {wizardStep === 3 && (
            <div className="text-center py-5">
              <div className="text-5xl mb-4">Create</div>
              <h4 className="text-lg font-bold mb-2">Ready to Create?</h4>
              <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
                Your course draft will be created. Add modules before submitting for review.
              </p>
              <div className="inline-block text-left bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-sm">Course details filled in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-sm">Pricing — {form.is_free ? "Free" : `P${form.price}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {coverPreview ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-neutral-300 inline-block shrink-0" />
                    )}
                    <span className="text-sm">Thumbnail — {coverPreview ? "uploaded" : "none (optional)"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFoot>
          <div className="flex items-center justify-between w-full">
            <div>
              {wizardStep > 1 && (
                <Button variant="secondary" size="sm" onClick={() => { setWizardStep(wizardStep - 1); setFormErrors({}); }}>
                  ← Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {wizardStep === 4 && (
                <Button variant="secondary" size="sm" disabled={saving} onClick={() => saveCourse()}>
                  Save as Draft
                </Button>
              )}
              <Button variant="primary" size="sm" loading={saving} onClick={handleWizardNext}>
                {wizardStep === 3 ? "Create Course" : "Next →"}
              </Button>
            </div>
          </div>
        </ModalFoot>
      </Modal>

      {/* Schedule Live Session Modal */}
      <ScheduleLiveModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onCreated={() => { setLiveFetched(false); fetchLiveSessions(); }}
        token={tokens?.access ?? ""}
        categories={categories}
      />
    </div>
  );
}
