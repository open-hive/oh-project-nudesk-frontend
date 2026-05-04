import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { StatsSection } from "@/components/home/stats-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { InstructorsSection } from "@/components/home/instructors-section";
import { SubjectsSection } from "@/components/home/subjects-section";
/*import { CtaSection } from "@/components/home/cta-section";*/
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* 1. Hero with dark bg, floating cards, search bar */}
        <HeroSection />
        
        {/* 2. Value props / features (3x2 grid) */}
        <FeaturesSection />
        
        {/* 3. Stats section with count-up animation */}
        <StatsSection />
        
        {/* 4. Top visited categories (icon cards with gradient overlay) */}
        <CategoriesSection />
        
        {/* 5. Testimonials carousel */}
        <TestimonialsSection />
        
        {/* 6. Featured tutors (4-column detailed cards) */}
        <InstructorsSection />
        
        {/* 7. Browse by subject (8-column directory grid) */}
        <SubjectsSection />
        
        {/* 8. Call to Action */}
       {/* <CtaSection /> */}
      </main>
      <Footer />
    </>
  );
}
