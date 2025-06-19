
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import Logo from "@/components/Logo";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Header with Logo */}
      <header className="relative z-20 flex justify-between items-center p-6 sm:p-8">
        <Logo />
        <div className="flex gap-4">
          <Button variant="outline" size="sm" className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10">
            Sign in
          </Button>
        </div>
      </header>

      {/* Main Hero Content */}
      <div className="flex-1 flex items-center justify-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-teal-900/20 animate-gradient-shift bg-[length:400%_400%]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_50%)]" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-neon-cyan rounded-full animate-float opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Turn{" "}
            <span className="text-gradient">words</span>
            {" "}into{" "}
            <span className="text-gradient">worlds</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Just type your idea — we'll turn it into a game.
            <br />
            <span className="text-neon-cyan font-medium">AI-powered game prototyping in seconds.</span>
          </p>

          {/* Demo placeholder */}
          <div className="mb-12 max-w-4xl mx-auto">
            <div className="relative gradient-border mb-8">
              <div className="gradient-border-inner p-8 rounded-lg">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center glow-effect">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 bg-neon-cyan rounded-full animate-glow" />
                    </div>
                    <p className="text-neon-cyan font-medium text-lg">Live Demo Coming Soon</p>
                    <p className="text-muted-foreground text-sm mt-2">Watch AI generate a game in real-time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-neon-cyan text-black hover:bg-neon-cyan/90 font-semibold px-8 py-4 text-lg glow-effect transition-all duration-300 hover:scale-105"
            >
              Try it now
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 font-medium px-8 py-4 text-lg"
            >
              Watch demo
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ArrowDown className="w-6 h-6 text-neon-cyan/60" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
