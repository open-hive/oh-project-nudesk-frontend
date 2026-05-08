"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";

type AccessType = "all" | "free" | "subscription";
type DiscoveryVariant = "courses" | "study-guides" | "live-sessions";

interface CommonFilters {
  categories: Category[];
  category: string;
  accessType: AccessType;
  minPrice: string;
  maxPrice: string;
  onCategoryChange: (value: string) => void;
  onAccessTypeChange: (value: AccessType) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
}

interface CourseSidebarFilters {
  minRating: string;
  minModules: string;
  maxModules: string;
  ordering: string;
  onMinRatingChange: (value: string) => void;
  onMinModulesChange: (value: string) => void;
  onMaxModulesChange: (value: string) => void;
  onOrderingChange: (value: string) => void;
}

interface StudyGuideSidebarFilters {
  minPages: string;
  maxPages: string;
  minDownloads: string;
  ordering: string;
  onMinPagesChange: (value: string) => void;
  onMaxPagesChange: (value: string) => void;
  onMinDownloadsChange: (value: string) => void;
  onOrderingChange: (value: string) => void;
}

interface LiveSessionSidebarFilters {
  status: string;
  startDate: string;
  endDate: string;
  seatsAvailableOnly: boolean;
  ordering: string;
  onStatusChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onSeatsAvailableOnlyChange: (value: boolean) => void;
  onOrderingChange: (value: string) => void;
}

interface SidebarProps {
  variant: DiscoveryVariant;
  common: CommonFilters;
  courseFilters?: CourseSidebarFilters;
  studyGuideFilters?: StudyGuideSidebarFilters;
  liveFilters?: LiveSessionSidebarFilters;
  onClear: () => void;
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-neutral-200 py-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
        <span className="text-neutral-400 text-xs">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="flex flex-col gap-2">{children}</div> : null}
    </div>
  );
}

function inputClassName(compact = false) {
  return [
    "w-full border-[1.5px] border-neutral-200 bg-white text-neutral-900 outline-none",
    "focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10",
    compact ? "rounded-lg px-2.5 py-1.5 text-xs" : "rounded-[10px] px-3 py-2 text-sm",
  ].join(" ");
}

function AccessOption({
  value,
  label,
  active,
  onSelect,
}: {
  value: AccessType;
  label: string;
  active: boolean;
  onSelect: (value: AccessType) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "border-violet-600 bg-violet-50 text-violet-700"
          : "border-neutral-200 text-neutral-600 hover:border-violet-300 hover:text-violet-700"
      }`}
    >
      {label}
    </button>
  );
}

export function Sidebar({
  variant,
  common,
  courseFilters,
  studyGuideFilters,
  liveFilters,
  onClear,
}: SidebarProps) {
  return (
    <aside className="w-full lg:w-[280px] lg:shrink-0 lg:self-start lg:sticky lg:top-[90px]">
      <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl px-5 py-2">
        <SidebarSection title="Category">
          <select
            className={inputClassName()}
            value={common.category}
            onChange={(e) => common.onCategoryChange(e.target.value)}
          >
            <option value="">All categories</option>
            {common.categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </SidebarSection>

        <SidebarSection title="Access Type">
          <div className="flex flex-col gap-2">
            <AccessOption
              value="all"
              label="All access types"
              active={common.accessType === "all"}
              onSelect={common.onAccessTypeChange}
            />
            <AccessOption
              value="free"
              label="Free only"
              active={common.accessType === "free"}
              onSelect={common.onAccessTypeChange}
            />
            <AccessOption
              value="subscription"
              label="Subscriber-only"
              active={common.accessType === "subscription"}
              onSelect={common.onAccessTypeChange}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Paid content uses the tutor&apos;s subscription pricing.
          </p>
        </SidebarSection>

        <SidebarSection title="Monthly Budget">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Min"
              value={common.minPrice}
              onChange={(e) => common.onMinPriceChange(e.target.value)}
              className={inputClassName(true)}
            />
            <span className="text-neutral-400 text-xs shrink-0">–</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Max"
              value={common.maxPrice}
              onChange={(e) => common.onMaxPriceChange(e.target.value)}
              className={inputClassName(true)}
            />
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            Filters paid items by the tutor&apos;s monthly subscription price.
          </p>
        </SidebarSection>

        {variant === "courses" && courseFilters ? (
          <>
            <SidebarSection title="Course Quality">
              <label className="text-xs font-semibold text-neutral-500">Minimum rating</label>
              <select
                className={inputClassName()}
                value={courseFilters.minRating}
                onChange={(e) => courseFilters.onMinRatingChange(e.target.value)}
              >
                <option value="">Any rating</option>
                <option value="4">4.0 and up</option>
                <option value="3">3.0 and up</option>
                <option value="2">2.0 and up</option>
              </select>
            </SidebarSection>

            <SidebarSection title="Course Size">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min modules"
                  value={courseFilters.minModules}
                  onChange={(e) => courseFilters.onMinModulesChange(e.target.value)}
                  className={inputClassName(true)}
                />
                <span className="text-neutral-400 text-xs shrink-0">–</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max modules"
                  value={courseFilters.maxModules}
                  onChange={(e) => courseFilters.onMaxModulesChange(e.target.value)}
                  className={inputClassName(true)}
                />
              </div>
            </SidebarSection>

            <SidebarSection title="Sort Courses">
              <select
                className={inputClassName()}
                value={courseFilters.ordering}
                onChange={(e) => courseFilters.onOrderingChange(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="highest_rated">Highest rated</option>
                <option value="most_reviewed">Most reviewed</option>
                <option value="most_modules">Most modules</option>
                <option value="oldest">Oldest first</option>
              </select>
            </SidebarSection>
          </>
        ) : null}

        {variant === "study-guides" && studyGuideFilters ? (
          <>
            <SidebarSection title="Guide Length">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min pages"
                  value={studyGuideFilters.minPages}
                  onChange={(e) => studyGuideFilters.onMinPagesChange(e.target.value)}
                  className={inputClassName(true)}
                />
                <span className="text-neutral-400 text-xs shrink-0">–</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max pages"
                  value={studyGuideFilters.maxPages}
                  onChange={(e) => studyGuideFilters.onMaxPagesChange(e.target.value)}
                  className={inputClassName(true)}
                />
              </div>
            </SidebarSection>

            <SidebarSection title="Popularity">
              <label className="text-xs font-semibold text-neutral-500">Minimum downloads</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 10"
                value={studyGuideFilters.minDownloads}
                onChange={(e) => studyGuideFilters.onMinDownloadsChange(e.target.value)}
                className={inputClassName()}
              />
            </SidebarSection>

            <SidebarSection title="Sort Guides">
              <select
                className={inputClassName()}
                value={studyGuideFilters.ordering}
                onChange={(e) => studyGuideFilters.onOrderingChange(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="most_downloaded">Most downloaded</option>
                <option value="longest">Longest guides</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="oldest">Oldest first</option>
              </select>
            </SidebarSection>
          </>
        ) : null}

        {variant === "live-sessions" && liveFilters ? (
          <>
            <SidebarSection title="Session Status">
              <select
                className={inputClassName()}
                value={liveFilters.status}
                onChange={(e) => liveFilters.onStatusChange(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live now</option>
                <option value="completed">Completed</option>
              </select>
            </SidebarSection>

            <SidebarSection title="Session Date">
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={liveFilters.startDate}
                  onChange={(e) => liveFilters.onStartDateChange(e.target.value)}
                  className={inputClassName()}
                />
                <input
                  type="date"
                  value={liveFilters.endDate}
                  onChange={(e) => liveFilters.onEndDateChange(e.target.value)}
                  className={inputClassName()}
                />
              </div>
            </SidebarSection>

            <SidebarSection title="Availability">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={liveFilters.seatsAvailableOnly}
                  onChange={(e) =>
                    liveFilters.onSeatsAvailableOnlyChange(e.target.checked)
                  }
                  className="w-4 h-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
                  Show only sessions with open seats
                </span>
              </label>
            </SidebarSection>

            <SidebarSection title="Sort Sessions">
              <select
                className={inputClassName()}
                value={liveFilters.ordering}
                onChange={(e) => liveFilters.onOrderingChange(e.target.value)}
              >
                <option value="soonest">Soonest first</option>
                <option value="most_popular">Most popular</option>
                <option value="newest">Newest created</option>
                <option value="latest">Latest scheduled first</option>
              </select>
            </SidebarSection>
          </>
        ) : null}

        <div className="pt-4 pb-2">
          <button
            type="button"
            onClick={onClear}
            className="w-full py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </div>
    </aside>
  );
}
