"use client";

import { Search, ChevronDown, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const verifiedTutors = [
  { initials: "TS", name: "Thabo Serame", location: "Gaborone" },
  { initials: "KN", name: "Kefilwe Ndlovu", location: "Francistown" },
  { initials: "MD", name: "Mpho Dithebe", location: "Lobatse" },
  { initials: "LO", name: "Lorato Oagile", location: "Maun" },
  { initials: "BM", name: "Boitumelo Masire", location: "Serowe" },
];

const popularSearches = ["Mathematics", "Sciences", "Languages"];

function DecorativeDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[18%] left-[6%] w-[12px] h-[12px] rounded-full bg-blue-400/40" />
      <div className="absolute top-[48%] left-[2%] w-[8px] h-[8px] rounded-full bg-blue-400/30" />
      <div className="absolute top-[10%] left-[40%] w-[8px] h-[8px] rounded-full bg-neutral-500/40" />
      <div className="absolute top-[6%] left-[58%] w-[6px] h-[6px] rounded-full bg-neutral-500/30" />
      <div className="absolute bottom-[32%] left-[10%] w-[6px] h-[6px] rounded-full bg-purple-400/30" />
      <div className="absolute bottom-0 left-0 flex items-end gap-[3px] px-5 pb-0 opacity-25">
        {[38, 52, 62, 48, 68, 44, 58, 36, 50, 42].map((h, i) => (
          <div
            key={i}
            className="w-[5px] rounded-t-sm"
            style={{
              height: `${h}px`,
              background: "linear-gradient(to top, #ec4899, #8b5cf6)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch() {
    const query = searchQuery.trim();
    router.push(query ? `/tutors?search=${encodeURIComponent(query)}` : "/tutors");
  }

  return (
    <section className="pt-[70px] bg-[#0d0d2b] min-h-[88vh] md:min-h-[650px] flex items-center overflow-hidden relative">
      <DecorativeDots />

      <div className="max-w-[1200px] mx-auto px-6 w-full relative z-[1]">
        <div className="flex items-center gap-0 py-10 md:py-14">

          {/* ── Left column ── */}
          <div className="flex-[0_0_50%] max-w-[50%]">



            <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold text-white leading-[1.15] tracking-[-0.02em] mb-5">
              Teach From Anywhere.
              <br />
              Build <span className="text-accent">Recurring Income.</span>
            </h1>

            <p className="text-[15px] text-white/55 leading-[1.75] mb-8 max-w-[480px]">
              Turn your knowledge into steady income. Set tutor subscription rates,
              publish your full library, and reach learners across Botswana and beyond.
            </p>

            <div className="bg-white rounded-[10px] shadow-2xl flex items-center h-[58px] overflow-hidden max-w-[560px]">
              <div className="flex items-center gap-2.5 px-4 flex-[2] h-full">
                <Search className="w-[18px] h-[18px] text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search tutors, subjects, or expertise"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="w-full h-full text-[14px] text-neutral-700 placeholder:text-neutral-400 outline-none bg-transparent"
                />
              </div>
              <div className="w-px h-8 bg-neutral-200 shrink-0" />
              <div className="flex items-center gap-1.5 px-4 flex-1 h-full cursor-pointer">
                <span className="text-[13px] text-neutral-400 truncate">Select category</span>
                <ChevronDown className="w-4 h-4 shrink-0 text-neutral-400" />
              </div>
              <button
                onClick={handleSearch}
                className="h-full px-7 bg-accent text-white text-[14px] font-semibold hover:bg-accent-hover transition-colors whitespace-nowrap shrink-0"
              >
                Search now
              </button>
            </div>

            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-white text-[12px] font-bold">Popular searches:</span>
              {popularSearches.map((tag, i) => (
                <span key={tag} className="flex items-center gap-2">
                  <button
                    className="text-white/50 text-[12px] hover:text-white transition-colors"
                    onClick={() => router.push(`/tutors?search=${encodeURIComponent(tag)}`)}
                  >
                    {tag}
                  </button>
                  {i < popularSearches.length - 1 && (
                    <span className="text-white/20 text-[12px]">,</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="flex-[0_0_50%] max-w-[50%] relative hidden md:block h-[460px]">

            {/* Layer 1: Main tutor photo circle — large, center-left */}
            <div
              className="absolute z-[10]"
              style={{
                left: "8%",
                top: "5%",
                width: "210px",
                height: "210px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid rgba(255,255,255,0.12)",
              }}
            >
              {/* Replace with: <Image src="/images/tutor-1.jpg" fill style={{objectFit:"cover"}} alt="Tutor" /> */}
              <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600" />
            </div>

            {/* Layer 2: Second tutor photo circle — smaller, bottom-right of first */}
            <div
              className="absolute z-[9]"
              style={{
                left: "32%",
                top: "32%",
                width: "165px",
                height: "165px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid rgba(255,255,255,0.10)",
              }}
            >
              {/* Replace with: <Image src="/images/tutor-2.jpg" fill style={{objectFit:"cover"}} alt="Tutor" /> */}
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500" />
            </div>

            {/* Layer 3: Tutor name list card — right side, no red tabs */}
            <div
              className="absolute z-[30] bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{
                right: "0%",
                top: "0%",
                width: "210px",
              }}
            >
              {verifiedTutors.map((tutor, i) => (
                <div
                  key={tutor.initials}
                  className="flex items-center gap-2.5 px-3.5 py-2.5"
                  style={{
                    borderBottom: i < verifiedTutors.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}
                >
                  <div className="w-[34px] h-[34px] rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-violet-700">{tutor.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-neutral-900 truncate">{tutor.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-neutral-400">{tutor.location}, BW</span>
                      <CheckCircle className="w-[11px] h-[11px] text-green-500 shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Layer 4: "Meet our verified professionals" badge — bottom, overlapping circles */}
            <div
              className="absolute z-[35] bg-white rounded-2xl shadow-xl p-4"
              style={{
                left: "4%",
                bottom: "4%",
                width: "255px",
              }}
            >
              <p className="text-[9px] font-bold text-violet-600 uppercase tracking-widest mb-1">
                Explore top talent
              </p>
              <p className="text-[13px] font-bold text-neutral-900 leading-snug mb-1.5">
                Meet our verified professionals
              </p>
              <p className="text-[10px] text-neutral-500 leading-relaxed mb-3">
                We have checked and verified every single professional to provide amazing quality work every time.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {["T", "K", "M", "L", "B"].map((letter) => (
                    <div
                      key={letter}
                      className="w-[22px] h-[22px] rounded-full bg-violet-100 border-2 border-white flex items-center justify-center"
                    >
                      <span className="text-[7px] font-bold text-violet-700">{letter}</span>
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-violet-600">10M+ Professional</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
