import React from 'react';

const Logo = ({ className = "", showText = true }: { className?: string, showText?: boolean }) => {
  if (!showText) {
    // Header usage: just show a big centered image with margin above
    return (
      <div className={`flex items-center justify-center mt-8 ${className}`} style={{ height: '80px' }}>
        <img
          src="/logo_main_transparent.png"
          alt="Level0 Logo"
          className="h-64 w-auto drop-shadow-lg pointer-events-none select-none"
          style={{ maxWidth: '100%' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    );
  }
  // Default: image + text, image absolutely positioned
  return (
    <div className={`relative flex items-center ${className}`} style={{ height: '80px', width: 'auto' }}>
      <img
        src="/logo_main_transparent.png"
        alt="Level0 Logo"
        className="absolute top-1/2 left-0 -translate-y-1/2 h-64 w-auto drop-shadow-lg pointer-events-none select-none"
        style={{ zIndex: 1 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="relative z-10 ml-64">
        <span className="text-2xl font-bold text-white">Level</span>
        <span className="text-2xl font-bold text-neon-cyan">0</span>
        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-neon-cyan to-neon-green"></div>
      </div>
    </div>
  );
};

export default Logo;
