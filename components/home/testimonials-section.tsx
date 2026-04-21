import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";

const testimonials = [
  {
    quote:
      "I was teaching privately in Maun for years, charging per session, chasing parents for payment. NuDesk changed everything — I uploaded my maths course, and students from Gabs, Francistown, everywhere started enrolling. My income doubled in three months.",
    name: "Olumide Martins",
    role: "Mathematics Tutor — Maun",
    initials: "OM",
    color: "orange" as const,
    earning: "P 4,820 / month",
  },
  {
    quote:
      "I was skeptical at first — I didn't think people would pay for online content in Botswana. I was wrong. My chemistry study guides alone bring in consistent income every month. The platform handles everything, I just create the content.",
    name: "Dr. Ama Mensah",
    role: "Chemistry Tutor — Gaborone",
    initials: "AM",
    color: "green" as const,
    earning: "P 1,960 / month",
  },
  {
    quote:
      "The live session feature is a game changer. I schedule two sessions a week, students from across the country join, ask questions in real time. It feels like a proper lecture hall — minus the commute. And I get paid automatically.",
    name: "Prof. Kwame Asante",
    role: "Physics Tutor — Gaborone",
    initials: "KA",
    color: "violet" as const,
    earning: "P 4,850 / month",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[520px] mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary border-[1.5px] border-primary-muted text-[.72rem] font-bold px-3.5 py-1 rounded-full uppercase tracking-[0.07em] mb-3.5">
            Tutor Stories
          </div>
          <h2 className="text-[2.1rem] font-extrabold text-neutral-900 leading-[1.2] tracking-[-0.03em]">
            What Tutors Are Saying
          </h2>
          <p className="text-base text-neutral-500 mt-3 leading-[1.65]">
            From side income to their primary earnings — here&apos;s how real tutors
            on NuDesk describe the change.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white border-[1.5px] border-neutral-200 rounded-[20px] p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-[3px] flex flex-col"
            >
              <div className="text-[2.5rem] text-primary leading-none mb-2.5 font-serif">
                &ldquo;
              </div>
              <p className="text-[.9rem] text-neutral-700 leading-[1.6] mb-5 flex-1">
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <Avatar initials={t.initials} size="md" color={t.color} />
                <div className="flex-1">
                  <div className="text-sm font-bold">{t.name}</div>
                  <div className="text-xs text-neutral-500">{t.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1">
                    {t.earning}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <StarRating rating={5} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
