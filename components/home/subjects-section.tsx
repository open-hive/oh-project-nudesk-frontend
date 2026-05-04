import Link from "next/link";
import { WaveDecoration } from "@/components/home/wave-decoration";

const subjectTiers = [
  {
    title: "Primary",
    subjects: [
      { name: "English", count: 45 },
      { name: "Setswana", count: 42 },
      { name: "Mathematics", count: 45 },
      { name: "Science", count: 38 },
      { name: "Social Studies", count: 30 },
    ],
  },
  {
    title: "JCE",
    subjects: [
      { name: "Mathematics", count: 50 },
      { name: "Science", count: 48 },
      { name: "English", count: 45 },
      { name: "Setswana", count: 35 },
      { name: "Agriculture", count: 20 },
    ],
  },
  {
    title: "BGCSE",
    subjects: [
      { name: "Accounting", count: 46 },
      { name: "Biology", count: 40 },
      { name: "Chemistry", count: 38 },
      { name: "Business Studies", count: 35 },
      { name: "Computer Science", count: 29 },
    ],
  },
  {
    title: "University",
    subjects: [
      { name: "Accounting", count: 30 },
      { name: "Law", count: 25 },
      { name: "Engineering", count: 22 },
      { name: "Medicine", count: 15 },
      { name: "Computer Sci.", count: 40 },
    ],
  },
  {
    title: "Languages",
    subjects: [
      { name: "Setswana", count: 20 },
      { name: "French", count: 17 },
      { name: "Portuguese", count: 14 },
      { name: "Zulu", count: 12 },
      { name: "Mandarin", count: 8 },
    ],
  },
  {
    title: "Short Courses",
    subjects: [
      { name: "Excel", count: 25 },
      { name: "Bookkeeping", count: 20 },
      { name: "First Aid", count: 15 },
      { name: "AutoCAD", count: 12 },
      { name: "Digital Mktg", count: 18 },
    ],
  },
  {
    title: "Arts & Music",
    subjects: [
      { name: "Acting", count: 10 },
      { name: "Dance", count: 15 },
      { name: "Music Theory", count: 12 },
      { name: "Drawing", count: 20 },
      { name: "Photography", count: 18 },
    ],
  },
  {
    title: "IT & Tech",
    subjects: [
      { name: "Python", count: 45 },
      { name: "Web Dev", count: 40 },
      { name: "Data Analysis", count: 35 },
      { name: "Java", count: 28 },
      { name: "Networking", count: 22 },
    ],
  },
];

export function SubjectsSection() {
  return (
    <section className="py-20 bg-[#F5F7FA]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Left-aligned header */}
        <div className="mb-10">
          <WaveDecoration className="justify-start" />
          <p className="text-[13px] text-neutral-500 mb-2">
            Explore from our huge collection
          </p>
          <h2 className="text-[2rem] font-bold text-neutral-900 leading-[1.2] tracking-[-0.02em]">
            Search top tutors by subject
          </h2>
        </div>

        {/* 8-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-x-6 gap-y-10">
          {subjectTiers.map((tier) => (
            <div key={tier.title}>
              <h3 className="text-[15px] font-bold text-neutral-900 border-b border-neutral-200 pb-2 mb-3">
                {tier.title}
              </h3>
              <ul className="flex flex-col gap-2 mb-3">
                {tier.subjects.map((sub) => (
                  <li key={sub.name}>
                    <Link
                      href="/courses"
                      className="flex justify-between items-center group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-[8px] h-[8px] rounded-full border border-neutral-300 shrink-0 group-hover:border-accent group-hover:bg-accent/10 transition-colors" />
                        <span className="text-[13px] text-neutral-500 group-hover:text-accent transition-colors truncate">
                          {sub.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400 shrink-0 ml-1">
                        ({sub.count})
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/courses"
                className="text-[13px] font-medium text-accent hover:underline inline-flex items-center gap-1"
              >
                Explore all &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
