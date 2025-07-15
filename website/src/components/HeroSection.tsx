import React from 'react';
import { Button } from "./ui/button";
import { ArrowDown } from "lucide-react";
import Logo from "./Logo";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Header with Logo */}
      <header className="relative z-20 flex justify-between items-center p-6 sm:p-8">
        <Logo showText={false} />
      </header>

      {/* Main Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-teal-900/20 animate-gradient-shift bg-[length:400%_400%]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_50%)]" />
        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
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

        {/* CTA Button - Most Prominent, First Thing */}
        <div className="z-10 w-full flex justify-center mt-8 mb-10">
          <Button
            size="lg"
            className="text-2xl px-12 py-6 font-extrabold bg-neon-cyan text-black glow-effect shadow-xl rounded-full border-4 border-neon-cyan hover:bg-neon-cyan/90 transition-all duration-300 hover:scale-105"
            style={{ boxShadow: '0 0 40px 0 rgba(0,255,255,0.25)' }}
            onClick={() => {
              const el = document.getElementById('beta-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Try it now
          </Button>
        </div>

        {/* Headline and Subheadline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-center">
          Turn <span className="text-gradient">words</span> into <span className="text-gradient">worlds</span>
        </h1>
        <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed text-center">
          Just type your idea — we'll turn it into a game.<br />
          <span className="text-neon-cyan font-medium">AI-powered game prototyping in seconds.</span>
        </p>

        {/* Demo placeholder */}
        <div className="mb-12 max-w-4xl mx-auto w-full">
          <div className="relative gradient-border mb-8">
            <div className="gradient-border-inner p-8 rounded-lg">
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center glow-effect">
                <video
                  src="/Demo_V1.mp4"
                  controls
                  className="w-full h-full rounded-lg object-cover"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
