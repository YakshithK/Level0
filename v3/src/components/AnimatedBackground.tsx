const AnimatedBackground = () => {
  return (
    <div className="animated-bg">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
};

export default AnimatedBackground;
