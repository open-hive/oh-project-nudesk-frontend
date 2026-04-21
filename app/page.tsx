import { HeroSection, StatsBar } from "@/components/home/hero-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { FeaturesSection } from "@/components/home/features-section";
import { CoursesSection } from "@/components/home/courses-section";
import { InstructorsSection } from "@/components/home/instructors-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CtaSection } from "@/components/home/cta-section";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBar />
        <HowItWorksSection />
        <FeaturesSection />
        <CoursesSection />
        <InstructorsSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
