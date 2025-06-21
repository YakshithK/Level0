import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { generatePhaserCode } from "@/utils/generateGame";

const configs = [
  {
    backgroundColor: "#1e1e2f",
    gravity: { y: 600 },
    player: {
      x: 100,
      y: 100,
      size: 30,
      color: 0x00ffcc,
      bounce: 0.3,
    },
    platforms: [
      { x: 200, y: 500, width: 400, height: 40, color: 0xff0000 },
      { x: 600, y: 400, width: 200, height: 30, color: 0x00ff00 },
      { x: 400, y: 300, width: 300, height: 20, color: 0x0000ff },
      { x: 100, y: 200, width: 250, height: 20, color: 0xffff00 },
    ],
    controls: {
      left: "LEFT",
      right: "RIGHT",
      jump: "SPACE",
    }
  },
  {
    backgroundColor: "#1e1e2f",
    gravity: { y: 600 },
    player: {
      x: 100,
      y: 100,
      size: 30,
      color: 0x00ffcc,
      bounce: 0.3,
    },
    platforms: [
      { x: 200, y: 500, width: 400, height: 40, color: 0xff0000 },
      { x: 600, y: 400, width: 200, height: 30, color: 0x00ff00 },
      { x: 400, y: 300, width: 300, height: 20, color: 0x0000ff },
      { x: 100, y: 200, width: 250, height: 20, color: 0xffff00 },
    ],
    controls: {
      left: "LEFT",
      right: "RIGHT",
      jump: "SPACE",
    }
  }
]

export const PhaserGame: React.FC<{
  configIndex: number;
  code: string;
}> = ({ configIndex, code }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (gameRef.current) {
      const { width, height } = gameRef.current.getBoundingClientRect();
      setSize({
        width: Math.max(400, Math.floor(width)),
        height: Math.max(300, Math.floor(height)),
      });
    }
  }, []);

  const destroyGame = () => {
    if (window && (window as any).__phaserGame) {
      (window as any).__phaserGame.destroy(true);
      (window as any).__phaserGame = null;
    }
    if (gameRef.current) {
      while (gameRef.current.firstChild) {
        gameRef.current.removeChild(gameRef.current.firstChild);
      }
    }
  };

  useEffect(() => {
    destroyGame();
    if (size.width > 0 && size.height > 0 && gameRef.current) {
      let codeToRun = code;
      const config = configs[configIndex];
      if (!code || !code.includes('parent: gameRef')) {
        codeToRun = generatePhaserCode(config);
      }
  
      try {
        (window as any).__phaserGame = new Function('Phaser', 'gameRef', codeToRun)(Phaser, gameRef.current);
  
        // Focus the latest canvas reliably
        setTimeout(() => {
          const canvases = gameRef.current?.querySelectorAll('canvas');
          const canvas = canvases?.[canvases.length - 1]; // last one = newest
          if (canvas) {
            canvas.setAttribute('tabindex', '0');
            canvas.focus();
            console.log('[REACT] Focused new Phaser canvas');
          } else {
            console.warn('[REACT] No canvas found in gameRef');
          }
        }, 250); // Slight delay to let Phaser fully attach
      } catch (e) {
        console.log(e);
      }
    }
  
    return () => {
      destroyGame();
    };
  }, [code, configIndex, size.width, size.height]);
  

  return (
    <div ref={gameRef} style={{ width: "100%", height: "100%" }} />
  );
};