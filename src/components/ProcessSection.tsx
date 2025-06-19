
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
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            From idea to{" "}
            <span className="text-gradient">playable game</span>
            {" "}in seconds
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI handles the complex stuff so you can focus on creativity
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="relative group"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Connecting line for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-neon-cyan/50 to-transparent z-0" />
                )}
                
                <div className="relative gradient-border h-full">
                  <div className="gradient-border-inner p-8 h-full flex flex-col">
                    <div className="flex items-center mb-6">
                      <div className="relative">
                        <div className="w-16 h-16 bg-neon-cyan/10 rounded-full flex items-center justify-center border border-neon-cyan/30">
                          <Icon className="w-8 h-8 text-neon-cyan" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-green rounded-full flex items-center justify-center text-black text-xs font-bold">
                          {step.number}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-semibold mb-4 text-white">
                      {step.title}
                    </h3>
                    
                    <p className="text-muted-foreground leading-relaxed flex-grow">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
