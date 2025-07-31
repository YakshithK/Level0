
import React from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { FileText, Code, Play } from "lucide-react";


const HeroSection = () => {

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

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdLrssp64lHvjYUPyyMOuTRkvDvDSIvBx_pXXiy_iO34Pz-mw/formResponse"
    const formData = new FormData()
    formData.append("entry.1036261049", email)

    try {
      await fetch(formUrl, {
        method: "POST",
        mode: "no-cors",
        body: formData
      })

      toast.success("You're on the list! We'll be in touch soon.")
      setEmail("")
    } catch (err) {
      toast.error("Something went wrong, Please Try again")
    } finally {
      setIsSubmitting(false)
    }
  };

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Header with Logo */}
      <header className="relative z-20 flex justify-between items-center p-6 sm:p-8">
        <Logo showText={false} />
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
          
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Just type your idea — we'll turn it into a game.
            <br />
            <span className="text-neon-cyan font-medium">AI-powered game prototyping in seconds.</span>
          </p>

          {/* Prominent CTA Section */}
          <div className="mb-16 max-w-2xl mx-auto">
            <div className="gradient-border mb-8">
              <div className="gradient-border-inner p-8 lg:p-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Join the{" "}
                  <span className="text-gradient">beta</span>
                </h2>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Be among the first to experience the future of AI game building. 
                  Early access starts soon, and spots are limited.
                </p>
                <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-grow h-12 text-lg bg-background border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="lg"
                      className="bg-neon-cyan text-black hover:bg-neon-cyan/90 font-semibold glow-effect whitespace-nowrap h-12 px-8 text-lg"
                    >
                      {isSubmitting ? "Joining..." : "Get early access"}
                    </Button>
                  </div>
                </form>
                {/* Referral Share Section */} 
                <div className="mt-8 mb-8 text-center">
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    🎉 Invite friends, get early access faster!
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Share this link with others. The more you refer, the sooner you get in.
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Input
                      type="text"
                      readOnly
                      value={`https://level0.app/?ref=${encodeURIComponent((email || "yourname").replace("@", "~"))}`}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full sm:w-auto flex-grow cursor-pointer text-sm text-muted-foreground"
                    />
                    <Button
                      type="button"
                      className="h-10 px-4 text-sm bg-neon-cyan text-black hover:bg-neon-cyan/90 font-semibold glow-effect"
                      onClick={() => {
                        const link = `https://level0.app/?ref=${encodeURIComponent((email || "yourname").replace("@", "~"))}`;
                        navigator.clipboard.writeText(link);
                        toast.success("Referral link copied!");
                      }}
                    >
                      📋 Copy Link
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="flex items-center justify-center gap-2">
                    <span>🎮</span> Full access to Level0 beta
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <span>⚡</span> Unlimited game generations
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <span>🚀</span> First to try new features
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Demo CTA Button */}
          <div className="max-w-md mx-auto mb-8">
            <Button
              onClick={scrollToDemo}
              variant="outline"
              size="lg"
              className="group border-neon-cyan/30 bg-background/50 backdrop-blur-sm hover:bg-neon-cyan/10 hover:border-neon-cyan/60 transition-all duration-300 glow-effect h-14 px-8 text-lg font-medium"
            >
              <span className="text-neon-cyan">Watch it in action</span>
              <ChevronDown className="ml-2 h-5 w-5 text-neon-cyan group-hover:translate-y-1 transition-transform duration-300" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              See how Level0 transforms ideas into games instantly
            </p>
          </div>

          {/* Demo section - now larger and with a title, no box */}
          <div id="demo-section" className="max-w-5xl mx-auto my-24">
            <h3 className="text-4xl sm:text-5xl font-bold mb-12 text-gradient text-center">
              Live Demo: <span className="text-gradient">Idea to Game in Seconds</span>
            </h3>
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center glow-effect" style={{ minHeight: '480px' }}>
              <video
                src="/Demo_V1.mp4"
                controls
                className="w-full h-full rounded-2xl object-cover"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Steps Section (formerly ProcessSection) */}
          <div className="relative z-10">
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
          </div>
        </div>
      </div>
      {/* Spacer for footer separation */}
      <div className="pb-24" />
    </section>
  );
};

export default HeroSection;
