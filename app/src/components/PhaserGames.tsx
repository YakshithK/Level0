import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

export const PhaserGame: React.FC<{
  configIndex: number;
  code: string;
}> = ({ configIndex, code }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [error, setError] = useState<string | null>(null);

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
    window.addEventListener('resize', updateSize);
    const resizeObserver = new window.ResizeObserver(updateSize);
    resizeObserver.observe(gameRef.current);
    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  const destroyGame = () => {
    if (gameInstance.current) {
      gameInstance.current.destroy(true);
      gameInstance.current = null;
    }
    if (gameRef.current) {
      while (gameRef.current.firstChild) {
        gameRef.current.removeChild(gameRef.current.firstChild);
      }
    }
  };

  useEffect(() => {
    setError(null);
    destroyGame();
    if (size.width > 0 && size.height > 0 && gameRef.current && code && code.trim()) {
      try {
        const sceneClass = new Function(`${code}; return typeof DynamicScene !== 'undefined' ? DynamicScene : null;`)();
        if (!sceneClass) {
          setError('No DynamicScene class was found in the code.');
          return;
        }
        const config = {
          type: Phaser.AUTO,
          width: size.width,
          height: size.height,
          backgroundColor: '#181c24',
          physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 600 }, debug: false } },
          scene: sceneClass,
          parent: gameRef.current,
        };
        gameInstance.current = new Phaser.Game(config);
        setTimeout(() => {
          const canvas = gameRef.current?.querySelector('canvas');
          if (canvas) {
            canvas.setAttribute('tabindex', '0');
            canvas.focus();
          }
        }, 100);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(`Game creation failed: ${errorMessage}\n\nCheck the browser console for more details.`);
      }
    }
    return () => {
      destroyGame();
    };
  }, [code, configIndex, size.width, size.height]);

  return (
    <div className="relative w-full h-full">
      <div ref={gameRef} style={{ width: "100%", height: "100%" }} />
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