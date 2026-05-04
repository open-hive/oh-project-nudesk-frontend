"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const LEVELS = ["Basic & Primary", "JCE", "BGCSE", "University", "Short Courses", "Professional"];
const PRICE_RANGES = ["Free", "Under P100", "P100 – P300", "P300 – P500", "Above P500"];
const RATINGS = [5, 4, 3, 2, 1];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["6AM–12PM", "12PM–5PM", "After 5PM"];
const AVAILABILITY = ["Online", "Offline", "Tutor's place", "Student's place"];

export function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`}
        />
      ))}
      <span className="text-xs text-neutral-500 ml-1">{rating}.0 / 5.0</span>
    </div>
  );
}

export function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-neutral-200 py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
        <span className="text-neutral-400 text-xs">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}

export function CheckItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="w-4 h-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
      />
      <span className={`text-sm transition-colors ${checked ? "text-violet-600 font-medium" : "text-neutral-600 group-hover:text-neutral-900"}`}>
        {label}
      </span>
    </label>
  );
}

export function RadioItem({ label, name }: { label: string; name: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="radio"
        name={name}
        className="w-4 h-4 border-neutral-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
      />
      <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">
        {label}
      </span>
    </label>
  );
}

export function Sidebar() {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [radius, setRadius] = useState(2);

  return (
    <aside className="w-[260px] shrink-0 self-start sticky top-[90px]">
      <div className="bg-white border-[1.5px] border-neutral-200 rounded-2xl px-5 py-2">

        <SidebarSection title="Subject & Level">
          <select className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/10">
            <option value="">Select category</option>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </SidebarSection>

        <SidebarSection title="Price range">
          {PRICE_RANGES.map((r) => <RadioItem key={r} label={r} name="price_range" />)}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-2.5 py-1.5 border-[1.5px] border-neutral-200 rounded-lg text-xs outline-none focus:border-violet-600"
            />
            <span className="text-neutral-400 text-xs shrink-0">–</span>
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-2.5 py-1.5 border-[1.5px] border-neutral-200 rounded-lg text-xs outline-none focus:border-violet-600"
            />
          </div>
        </SidebarSection>

        <SidebarSection title="Instructor availability">
          {TIMES.map((t) => <CheckItem key={t} label={t} />)}
        </SidebarSection>

        <SidebarSection title="Day of week">
          <div className="grid grid-cols-4 gap-1.5">
            {DAYS.map((d) => {
              const [sel, setSel] = useState(false);
              return (
                <button
                  key={d}
                  onClick={() => setSel(!sel)}
                  className={`py-1 rounded-lg text-xs font-medium border transition-colors ${
                    sel
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-violet-400 hover:text-violet-600"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </SidebarSection>

        <SidebarSection title="Rating">
          {RATINGS.map((r) => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="rating"
                className="w-4 h-4 border-neutral-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <StarRow rating={r} />
            </label>
          ))}
        </SidebarSection>

        <SidebarSection title="Tutor location">
          <select className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 mb-2">
            <option value="">Select Country</option>
            <option>Botswana</option>
          </select>
          <select className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm bg-white outline-none focus:border-violet-600 mb-2">
            <option value="">Select district</option>
            <option>South East</option>
            <option>North East</option>
            <option>Kweneng</option>
            <option>Central</option>
            <option>North West</option>
            <option>Kgatleng</option>
          </select>
          <input
            type="text"
            placeholder="Enter City"
            className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm outline-none focus:border-violet-600 mb-2"
          />
          <input
            type="text"
            placeholder="Enter address or area"
            className="w-full px-3 py-2 border-[1.5px] border-neutral-200 rounded-[10px] text-sm outline-none focus:border-violet-600 mb-2"
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-500 shrink-0">Radius in km</span>
            <input
              type="range"
              min={1}
              max={100}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs font-semibold text-neutral-700 shrink-0 min-w-[30px]">{radius}km</span>
          </div>
        </SidebarSection>

        <SidebarSection title="Miscellaneous">
          {AVAILABILITY.map((a) => <CheckItem key={a} label={a} />)}
        </SidebarSection>

        <div className="pt-4 pb-2 flex flex-col gap-2">
          <button className="w-full py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors">
            Apply filters
          </button>
          <button className="w-full py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
            Clear all filters
          </button>
        </div>

      </div>
    </aside>
  );
}