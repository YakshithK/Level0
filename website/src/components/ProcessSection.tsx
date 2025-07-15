
import { FileText, Code, Play } from "lucide-react";

const ProcessSection = () => {
  const steps = [
    {
      icon: FileText,
      title: "Describe your game",
      description: "Just type what you want: 'A platformer where you're a cat collecting fish' or 'Space shooter with neon graphics'",
      number: "01"
    },
    {
      icon: Code,
      title: "We generate the code",
      description: "Our AI understands game mechanics, physics, and art styles to create working game code instantly",
      number: "02"
    },
    {
      icon: Play,
      title: "You play it instantly",
      description: "Your game loads in the browser immediately. Tweak it with more prompts or share it with friends",
      number: "03"
    }
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Connecting gradient background that flows from hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background to-background" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-neon-cyan/5 to-transparent" />
      
      {/* Floating particles for visual continuity */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-neon-green/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Enhanced section header with better visual hierarchy */}
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <div className="bg-gradient-to-r from-neon-cyan/20 to-neon-green/20 rounded-full px-6 py-2 border border-neon-cyan/30">
              <span className="text-neon-cyan font-medium text-sm uppercase tracking-wider">How it works</span>
            </div>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            From idea to{" "}
            <span className="text-gradient">playable game</span>
            <br />
            <span className="text-2xl sm:text-3xl lg:text-4xl text-muted-foreground font-normal">
              in seconds
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Our AI handles the complex stuff so you can focus on creativity.
            <br />
            <span className="text-neon-green font-medium">No coding experience required.</span>
          </p>
        </div>

        {/* Enhanced process steps with better visual flow */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting flow lines */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
          
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="relative group animate-fade-in"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                {/* Connecting arrows for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 -right-6 w-12 h-0.5 bg-gradient-to-r from-neon-cyan/50 to-neon-green/50 z-10">
                    <div className="absolute right-0 top-[-2px] w-0 h-0 border-l-4 border-l-neon-green/70 border-t-2 border-b-2 border-t-transparent border-b-transparent" />
                  </div>
                )}
                
                <div className="relative gradient-border h-full group-hover:scale-105 transition-all duration-300">
                  <div className="gradient-border-inner p-8 h-full flex flex-col bg-gradient-to-br from-background to-background/80 backdrop-blur-sm">
                    <div className="flex items-center mb-8">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-neon-cyan/20 to-neon-green/20 rounded-full flex items-center justify-center border-2 border-neon-cyan/40 group-hover:border-neon-cyan/70 transition-colors duration-300 glow-effect">
                          <Icon className="w-10 h-10 text-neon-cyan group-hover:text-neon-green transition-colors duration-300" />
                        </div>
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-neon-green to-neon-cyan rounded-full flex items-center justify-center text-black text-sm font-bold shadow-lg glow-effect">
                          {step.number}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-white group-hover:text-gradient transition-all duration-300">
                      {step.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed flex-grow text-lg">
                      {step.description}
                    </p>
                    
                    {/* Step completion indicator */}
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <div className="flex items-center text-sm text-neon-cyan/70 group-hover:text-neon-cyan transition-colors duration-300">
                        <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2 animate-pulse"></div>
                        Step {step.number}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call-to-action at the end of process section */}
        <div className="text-center mt-20">
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Ready to turn your game ideas into reality?
            </p>
            <div className="inline-block gradient-border">
              <div className="gradient-border-inner px-8 py-4">
                <p className="text-neon-cyan font-medium">
                  Join thousands of creators already building with Level0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
