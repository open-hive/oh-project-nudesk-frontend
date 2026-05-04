import { CheckCircle, Heart } from "lucide-react";
import { WaveDecoration } from "@/components/home/wave-decoration";
import { Button } from "@/components/ui/button";

const tutors = [
  {
    initials: "TM",
    name: "Thabo Serame",
    location: "Gaborone, BW",
    rate: "P150/hr",
    whatsapp: "+267 7X XXX",
    qual: "B.Ed Maths",
    rating: "5.0",
    reviews: 12,
    bg: "bg-violet-100",
    color: "text-violet-700",
  },
  {
    initials: "KN",
    name: "Kefilwe Ndlovu",
    location: "Francistown, BW",
    rate: "P120/hr",
    whatsapp: "+267 7X XXX",
    qual: "BSc Physics",
    rating: "5.0",
    reviews: 9,
    bg: "bg-orange-100",
    color: "text-orange-700",
  },
  {
    initials: "OD",
    name: "Onkabetse D.",
    location: "Gaborone, BW",
    rate: "P180/hr",
    whatsapp: "+267 7X XXX",
    qual: "M.Sc Chemistry",
    rating: "5.0",
    reviews: 15,
    bg: "bg-green-100",
    color: "text-green-700",
  },
  {
    initials: "MS",
    name: "Mpho Sithole",
    location: "Maun, BW",
    rate: "P100/hr",
    whatsapp: "+267 7X XXX",
    qual: "PGCE English",
    rating: "4.8",
    reviews: 7,
    bg: "bg-amber-100",
    color: "text-amber-700",
  },
];

export function InstructorsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-[600px] mx-auto mb-12">
          <WaveDecoration />
          <p className="text-[13px] text-neutral-500 mb-2">
            Our featured tutors
          </p>
          <h2 className="text-[2rem] font-bold text-neutral-900 leading-[1.2] tracking-[-0.02em] mb-3">
            Highly qualified professionals
          </h2>
          <p className="text-[15px] text-neutral-500 leading-[1.6]">
            Every tutor on NuDesk is vetted for subject expertise and teaching ability. Connect with the best educators in Botswana.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tutors.map((tutor) => (
            <div
              key={tutor.name}
              className="bg-white rounded-[12px] border border-neutral-200 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group"
            >
              {/* Image / Cover area */}
              <div className="h-[140px] bg-neutral-100 relative">
                {/* Fallback pattern for cover */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-400 to-transparent" />
                <div className="absolute top-2 left-2 bg-error text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Featured
                </div>
              </div>

              {/* Info Body */}
              <div className="p-4 pt-0 relative">
                {/* Avatar */}
                <div
                  className={`w-[48px] h-[48px] rounded-full border-2 border-white absolute -top-[24px] left-4 flex items-center justify-center font-bold text-[14px] ${tutor.bg} ${tutor.color}`}
                >
                  {tutor.initials}
                </div>

                <div className="pt-8 mb-4">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="text-[14px] font-bold text-neutral-900 truncate">
                      {tutor.name}
                    </h3>
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  </div>
                  <p className="text-[12px] text-neutral-500 truncate">
                    {tutor.location}
                  </p>
                </div>

                {/* Details Table */}
                <div className="flex flex-col gap-1.5 mb-4">
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-neutral-500">Starting from:</span>
                    <span className="font-medium text-neutral-900">{tutor.rate}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-neutral-500">WhatsApp:</span>
                    <span className="font-medium text-neutral-900">{tutor.whatsapp}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-neutral-500">Qual:</span>
                    <span className="font-medium text-neutral-900">{tutor.qual}</span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="pt-3 border-t border-neutral-200 flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 text-[11px] tracking-widest">
                      Rating
                    </span>
                    <span className="text-[11px] font-bold text-neutral-900 ml-1">
                      {tutor.rating}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      ({tutor.reviews})
                    </span>
                  </div>
                  <button className="text-neutral-400 hover:text-red-500 transition-colors">
                    <Heart className="w-[14px] h-[14px]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex gap-1.5 justify-center mt-6">
          <div className="w-4 h-1 rounded-full bg-primary" />
          <div className="w-4 h-1 rounded-full bg-neutral-300" />
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <Button variant="primary" size="lg" href="/courses" className="rounded-xl">
            Explore all tutors →
          </Button>
        </div>
      </div>
    </section>
  );
}
