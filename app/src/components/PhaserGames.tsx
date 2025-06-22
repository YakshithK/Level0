import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { 
  createDynamicGame, 
  validateUserCode, 
  DEFAULT_SCENE_BOILERPLATE,
  GAME_CONFIG 
} from "@/utils/generateGame";

export const PhaserGame: React.FC<{
  configIndex: number;
  code: string;
}> = ({ configIndex, code }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [error, setError] = useState<string | null>(null);

  // Handle size changes with ResizeObserver
  useEffect(() => {
    if (!gameRef.current) return;

    const updateSize = () => {
      const { width, height } = gameRef.current!.getBoundingClientRect();
      setSize({
        width: Math.max(400, Math.floor(width)),
        height: Math.max(300, Math.floor(height)),
      });
    };

    updateSize();

    // Listen for window resize
    window.addEventListener('resize', updateSize);

    // Use ResizeObserver for container changes
    const resizeObserver = new window.ResizeObserver(updateSize);
    resizeObserver.observe(gameRef.current);

    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  // Destroy the current game instance
  const destroyGame = () => {
    if (gameInstance.current) {
      console.log('[PhaserGame] Destroying game instance...');
      gameInstance.current.destroy(true);
      gameInstance.current = null;
    }
    
    // Clean up DOM
    if (gameRef.current) {
      while (gameRef.current.firstChild) {
        gameRef.current.removeChild(gameRef.current.firstChild);
      }
    }
  };

  // Create and run the game with user code
  useEffect(() => {
    console.log('[PhaserGame] Code or config changed, recreating game...');
    
    // Clear previous error
    setError(null);
    
    // Destroy existing game
    destroyGame();
    
    if (size.width > 0 && size.height > 0 && gameRef.current) {
      try {
        // Validate user code first
        const validation = validateUserCode(code || DEFAULT_SCENE_BOILERPLATE);
        if (!validation.isValid) {
          setError(`Code validation failed:\n${validation.errors.join('\n')}`);
          return;
        }

        // Use the code provided or fall back to default boilerplate
        const codeToRun = code || DEFAULT_SCENE_BOILERPLATE;
        
        console.log('[PhaserGame] Creating dynamic game with code:', codeToRun.substring(0, 100) + '...');
        
        // Create the game with the dynamic scene
        gameInstance.current = createDynamicGame(gameRef.current, codeToRun, GAME_CONFIG, Phaser);
        
        // Focus the canvas after creation
        setTimeout(() => {
          const canvas = gameRef.current?.querySelector('canvas');
          if (canvas) {
            canvas.setAttribute('tabindex', '0');
            canvas.focus();
            console.log('[PhaserGame] Focused new Phaser canvas');
          }
        }, 100);
        
        console.log('[PhaserGame] Game created successfully');
        
      } catch (error) {
        console.error('[PhaserGame] Error creating game:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(`Game creation failed: ${errorMessage}\n\nCheck the browser console for more details.`);
      }
    }

    // Cleanup function
    return () => {
      destroyGame();
    };
  }, [code, configIndex, size.width, size.height]);

  return (
    <div className="relative w-full h-full">
      <div ref={gameRef} style={{ width: "100%", height: "100%" }} />
      
      {/* Error display */}
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-900 text-white p-4 text-sm font-mono whitespace-pre-wrap z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">{error}</div>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};