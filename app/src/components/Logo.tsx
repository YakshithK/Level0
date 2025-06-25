
import React from 'react';

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <span className="text-2xl font-bold text-white">Level</span>
        <span className="text-2xl font-bold text-neon-cyan">0</span>
        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-neon-cyan to-neon-green"></div>
      </div>
    </div>
  );
};

export default Logo;
