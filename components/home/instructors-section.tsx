import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

const tutors = [
  { initials: "SO", name: "Dr. Sarah Osei", field: "Mathematics", students: 148, courses: 18, rating: 5, color: "violet" as const, monthly: "P 3,200" },
  { initials: "KA", name: "Prof. Kwame Asante", field: "Physics", students: 210, courses: 12, rating: 5, color: "orange" as const, monthly: "P 4,850" },
  { initials: "AM", name: "Dr. Ama Mensah", field: "Chemistry", students: 96, courses: 8, rating: 5, color: "green" as const, monthly: "P 1,960" },
  { initials: "AW", name: "Prof. Abena Wiredu", field: "Economics", students: 180, courses: 14, rating: 5, color: "yellow" as const, monthly: "P 3,740" },
  { initials: "NO", name: "Nadia Osei-Bonsu", field: "Computer Science", students: 320, courses: 6, rating: 4, color: "violet" as const, monthly: "P 6,100" },
];

export function InstructorsSection() {
  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[540px] mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary border-[1.5px] border-primary-muted text-[.72rem] font-bold px-3.5 py-1 rounded-full uppercase tracking-[0.07em] mb-3.5">
            Tutors Already Earning
          </div>
          <h2 className="text-[2.1rem] font-extrabold text-neutral-900 leading-[1.2] tracking-[-0.03em]">
            Real Tutors, Real Income
          </h2>
          <p className="text-base text-neutral-500 mx-auto leading-[1.65] mt-3.5">
            These tutors joined NuDesk and turned their subject expertise into
            a consistent monthly income — without leaving their day jobs.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {tutors.map((inst) => (
            <div
              key={inst.name}
              className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] p-5 text-center cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-[3px]"
            >
              <Avatar
                initials={inst.initials}
                size="xl"
                color={inst.color}
                className="mx-auto mb-3"
              />
              <div className="text-[.9rem] font-bold mb-0.5">{inst.name}</div>
              <div className="text-[.78rem] text-neutral-500 mb-2">
                {inst.field}
              </div>
              <div className="flex justify-center mb-2">
                <StarRating rating={inst.rating} />
              </div>
              <div className="text-xs text-neutral-500 mb-2.5">
                {inst.students} students &middot; {inst.courses} courses
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl py-1.5 px-2 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-[.72rem] font-bold text-green-700">{inst.monthly}/mo</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline-v" size="lg" href="/auth/signup?role=tutor">
            Join These Tutors
          </Button>
        </div>
      </div>
    </section>
  );
}
