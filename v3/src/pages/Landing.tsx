import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Sparkles, Gamepad2, Code, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const Landing = () => {
  const [gameIdea, setGameIdea] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleIdeaSubmit = () => {
    if (!gameIdea.trim()) return;

    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate('/workspace', { state: { initialIdea: gameIdea } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleIdeaSubmit();
    }
  };

  const handleAuthSuccess = () => {
    if (gameIdea.trim()) {
      navigate('/workspace', { state: { initialIdea: gameIdea } });
    }
  };

  const examplePrompts = [
    "classic snake game",
    "flappy bird clone",
    "space invaders",
    "brick breaker",
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-6 py-12">
      <AnimatedBackground />
      
      {/* Top Right Navigation */}
      <div className="absolute top-8 right-12 z-20">
        {user ? (
          <Button
            variant="ghost"
            size="default"
            onClick={() => navigate('/dashboard')}
            className="glass border-primary/20 hover:border-accent/60"
          >
            Dashboard
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="default"
            onClick={() => setShowAuthModal(true)}
            className="glass border-primary/20 hover:border-accent/60"
          >
            Sign In
          </Button>
        )}
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl w-full space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-5">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Create Games
            </span>
            <br />
            <span className="text-foreground">with AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Transform your ideas into playable games instantly. No coding required.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass p-5 rounded-xl border border-primary/20 text-center space-y-2 hover:border-accent/40 smooth-transition">
            <Sparkles className="h-7 w-7 mx-auto text-accent" />
            <h3 className="font-semibold">AI-Powered</h3>
            <p className="text-xs text-muted-foreground">Advanced AI creates your game</p>
          </div>
          <div className="glass p-5 rounded-xl border border-primary/20 text-center space-y-2 hover:border-accent/40 smooth-transition">
            <Code className="h-7 w-7 mx-auto text-accent" />
            <h3 className="font-semibold">Full Control</h3>
            <p className="text-xs text-muted-foreground">Edit code or use prompts</p>
          </div>
          <div className="glass p-5 rounded-xl border border-primary/20 text-center space-y-2 hover:border-accent/40 smooth-transition">
            <Zap className="h-7 w-7 mx-auto text-accent" />
            <h3 className="font-semibold">Instant Preview</h3>
            <p className="text-xs text-muted-foreground">See changes in real-time</p>
          </div>
        </div>

        {/* Game Idea Input */}
        <div className="glass-strong p-6 rounded-2xl border border-primary/20 space-y-4">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-6 w-6 text-accent" />
            <h2 className="text-2xl font-bold">What game do you want to create?</h2>
          </div>
          
          <Textarea
            placeholder="Describe your game idea... (e.g., 'A platformer where you play as a robot collecting energy cores')"
            value={gameIdea}
            onChange={(e) => setGameIdea(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] glass border-primary/30 focus:border-accent/60 resize-none"
          />

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Try:</span>
            {examplePrompts.map((example) => (
              <Button
                key={example}
                variant="outline"
                size="sm"
                onClick={() => setGameIdea(example)}
                className="text-xs glass border-border/50 hover:border-accent/40"
              >
                {example}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-2 py-1 rounded bg-muted text-xs">Enter</kbd> to start
            </p>
            <Button
              onClick={handleIdeaSubmit}
              disabled={!gameIdea.trim()}
              className="bg-gradient-to-r from-primary to-accent glow-primary"
            >
              Start Creating
            </Button>
          </div>
        </div>
      </main>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Landing;
