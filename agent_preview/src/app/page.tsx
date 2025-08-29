"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Landing() {
  const router = useRouter();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameCode, setGameCode] = useState<string>('');
  const [gameThinking, setGameThinking] = useState<string>('');

  // Helper function to extract game title from code
  const extractGameTitle = (code: string): string => {
    const projectMatch = code.match(/\/\/project="([^"]+)"/);
    return projectMatch ? projectMatch[1] : 'Generated Game';
  };

  // Inject CSS animations
  useEffect(() => {
    const modalStyles = `
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      .animate-gradient-shift {
        animation: gradient-shift 6s ease infinite;
      }
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      .text-gradient {
        background: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff);
        background-size: 400% 400%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: gradient-shift 3s ease infinite;
      }
      .glow-effect {
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
      }
      .glow-effect:hover {
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = modalStyles;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleGenerateGame = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/kimi-k2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: aiPrompt,
          isInitialPrompt: true,
          conversationHistory: []
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.code && result.code.trim()) {
        setGameCode(result.code);
        setGameThinking(result.thinking || '');
        
        // Automatically save to project and redirect to advanced editor
        console.log('[Landing] Auto-saving to project and redirecting...');
        
        try {
          const saveResponse = await fetch('/api/save-to-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameCode: result.code,
              prompt: aiPrompt,
              gameTitle: extractGameTitle(result.code) || 'Generated Game'
            })
          });
          
          if (saveResponse.ok) {
            console.log('[Landing] Project saved successfully, redirecting...');
            router.push('/route');
          } else {
            console.error('[Landing] Failed to save project, but redirecting anyway');
            router.push('/route');
          }
        } catch (saveError) {
          console.error('[Landing] Error saving project:', saveError);
          // Still redirect even if save fails
          router.push('/route');
        }
      } else {
        setError('No game code was generated. Please try a different prompt.');
      }
      
    } catch (err) {
      console.error('[Landing] Error generating game:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the game');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvancedEdit = () => {
    // Save the current game to example-project and navigate to advanced editor
    fetch('/api/save-to-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameCode: gameCode,
        prompt: aiPrompt,
        gameTitle: extractGameTitle(gameCode) || 'Generated Game'
      })
    }).then(() => {
      router.push('/route');
    }).catch(err => {
      console.error('Error saving to project:', err);
      // Navigate anyway - the advanced editor can handle empty projects
      router.push('/route');
    });
  };

  const createGameHTML = (sceneCode: string): string => {
    const gameTitle = extractGameTitle(sceneCode);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${gameTitle}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #1a1a1a;
            font-family: Arial, sans-serif;
        }
        #game-container {
            border: 2px solid #333;
            border-radius: 8px;
        }
        canvas {
            display: block;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>
    
    <!-- Phaser.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.70.0/phaser.min.js"></script>
    
    <!-- Game Code -->
    <script>
${sceneCode}

// Game Configuration
class Game {
    constructor() {
        this.config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            backgroundColor: '#2c3e50',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [DynamicScene]
        };
        
        this.game = new Phaser.Game(this.config);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});
    </script>
</body>
</html>`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="relative z-20 flex justify-between items-center p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg"></div>
          <span className="text-xl font-bold">Level0</span>
        </div>
        <button
          onClick={() => router.push('/route')}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Advanced Editor
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-teal-900/20 animate-gradient-shift bg-[length:400%_400%]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_50%)]" />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Turn{" "}
              <span className="text-gradient">words</span>
              {" "}into{" "}
              <span className="text-gradient">worlds</span>
            </h1>
              
              <p className="text-xl sm:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                <span className="text-cyan-400 font-medium">AI-powered game prototyping in seconds.</span>
              </p>

              <form
                className="w-full max-w-xl mx-auto flex flex-col items-center"
                onSubmit={e => {
                  e.preventDefault();
                  handleGenerateGame();
                }}
              >
                <textarea
                  className="w-full h-32 p-4 rounded-lg border border-gray-600 bg-gray-800 text-white text-lg focus:outline-none focus:border-cyan-400 resize-none shadow-lg"
                  placeholder="Describe your game (e.g., 'A lava platformer with double jump and spikes')"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateGame();
                    }
                  }}
                  disabled={isGenerating}
                  autoFocus
                />

                <button
                  type="submit"
                  className="mt-6 bg-cyan-400 text-black hover:bg-cyan-300 font-semibold px-8 py-4 text-lg glow-effect transition-all duration-300 hover:scale-105 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isGenerating || !aiPrompt.trim()}
                >
                  {isGenerating ? 'Generating...' : 'Generate Game'}
                </button>
                
              {error && (
                <div className="mt-4 text-red-400 text-base">Error: {error}</div>
              )}
            </form>
          </>
        </div>
      </div>
    </div>
  );
}