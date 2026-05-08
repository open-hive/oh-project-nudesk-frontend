"use client";

import { useState } from "react";
import { Modal, ModalHead, ModalBody, ModalFoot } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/api";
import type { LiveClass, LiveClassCreatePayload, Category } from "@/lib/types";

interface ScheduleLiveModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lc: LiveClass) => void;
  token: string;
  categories: Category[];
}

export function ScheduleLiveModal({
  open,
  onClose,
  onCreated,
  token,
  categories,
}: ScheduleLiveModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<LiveClassCreatePayload>({
    title: "",
    description: "",
    category: categories[0]?.id ?? 0,
    scheduled_date: "",
    start_time: "",
    end_time: "",
    max_capacity: 80,
    is_free: true,
    price: "0",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const payload = { ...form, price: "0" };
      const lc = await apiFetch<LiveClass>("/courses/my-live-classes/", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      });
      toast.success("Live class submitted for review!");
      onCreated(lc);
      onClose();
      setForm({
        title: "",
        description: "",
        category: categories[0]?.id ?? 0,
        scheduled_date: "",
        start_time: "",
        end_time: "",
        max_capacity: 80,
        is_free: true,
        price: "0",
      });
    } catch (err) {
      if (err instanceof ApiError && err.body) {
        if (typeof err.body.detail === "string") {
          toast.error(err.body.detail);
        }
        const fieldErrors: Record<string, string> = {};
        for (const [key, val] of Object.entries(err.body)) {
          fieldErrors[key] = Array.isArray(val) ? val[0] : String(val);
        }
        setErrors(fieldErrors);
      } else {
        toast.error("Failed to schedule live class.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md">
      <ModalHead
        title="Schedule Live Class"
        subtitle="Set up a new live session for your students"
        onClose={onClose}
      />
      <ModalBody>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
              Title
            </label>
            <Input
              placeholder="e.g. Calculus Problem Clinic — Week 5"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              error={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-error mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
              Description
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white text-neutral-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,.12)] min-h-[80px] resize-y"
              placeholder="Describe what this session will cover..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
            {errors.description && (
              <p className="text-xs text-error mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
              Category
            </label>
            <select
              className="w-full px-3.5 py-2.5 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white text-neutral-900 outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,.12)]"
              value={form.category}
              onChange={(e) => update("category", Number(e.target.value))}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-error mt-1">{errors.category}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
                Date
              </label>
              <Input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => update("scheduled_date", e.target.value)}
                error={!!errors.scheduled_date}
              />
              {errors.scheduled_date && (
                <p className="text-xs text-error mt-1">
                  {errors.scheduled_date}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
                Start Time
              </label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => update("start_time", e.target.value)}
                error={!!errors.start_time}
              />
              {errors.start_time && (
                <p className="text-xs text-error mt-1">{errors.start_time}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
                End Time
              </label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => update("end_time", e.target.value)}
                error={!!errors.end_time}
              />
              {errors.end_time && (
                <p className="text-xs text-error mt-1">{errors.end_time}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
              Max Capacity
            </label>
            <Input
              type="number"
              min={1}
              value={form.max_capacity}
              onChange={(e) => update("max_capacity", Number(e.target.value))}
              error={!!errors.max_capacity}
            />
            {errors.max_capacity && (
              <p className="text-xs text-error mt-1">{errors.max_capacity}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
              Access
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricing"
                  checked={form.is_free}
                  onChange={() => update("is_free", true)}
                  className="accent-primary"
                />
                <span className="text-sm">Free</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricing"
                  checked={!form.is_free}
                  onChange={() => update("is_free", false)}
                  className="accent-primary"
                />
                <span className="text-sm">Subscriber-only</span>
              </label>
            </div>
            {!form.is_free && (
              <p className="text-xs text-neutral-500 mt-2">
                Learners join this session through your tutor subscription plan. Set the actual rates from the Payments page.
              </p>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFoot>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} loading={loading}>
          Schedule
        </Button>
      </ModalFoot>
    </Modal>
  );
}
