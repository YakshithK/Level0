
import HeroSection from "@/components/HeroSection";
import ProcessSection from "@/components/ProcessSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import BetaSection from "@/components/BetaSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <ProcessSection />
      <TestimonialsSection />
      <BetaSection />
      
      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 Level0. Built with AI, designed for creators.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
