import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

const configs = [
  {
    player: {x: 100, y: 100, color: 0x000000},
    platforms: [
      {x: 200, y: 300, width: 400, height: 40, color: 0xff0000},
      {x: 300, y: 200, width: 100, height: 20, color: 0x0000ff}
    ],
    gravity: 600
  },
  {
    player: {x: 50, y: 50, color: 0x000000},
    platforms: [
      {x: 150, y: 150, width: 200, height: 30, color: 0x39ff14}
    ],
    gravity: 6000
  }
]

export const PhaserGame: React.FC<{
  configIndex: number;
  code: string;
}> = ({ configIndex, code }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [size, setSize] = useState({ width: 400, height: 300 });

  // ResizeObserver to update size
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        const { width, height } = gameRef.current.getBoundingClientRect();
        setSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    };
    handleResize();
    const observer = new window.ResizeObserver(handleResize);
    if (gameRef.current) {
      observer.observe(gameRef.current);
    }
    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Helper to destroy previous game
  const destroyGame = () => {
    // Destroy the Phaser game instance if possible
    if (window && (window as any).__phaserGame) {
      (window as any).__phaserGame.destroy(true);
      (window as any).__phaserGame = null;
    }
    if (gameInstance.current) {
      gameInstance.current.destroy(true);
      gameInstance.current = null;
    }
    // Remove all children from the gameRef container (removes all canvases)
    if (gameRef.current) {
      while (gameRef.current.firstChild) {
        gameRef.current.removeChild(gameRef.current.firstChild);
      }
    }
  };

  // Generate game from config (default)
  const generateGame = (config: any) => {
    destroyGame();
    class GameScene extends Phaser.Scene {
      customConfig: any;
      player!: Phaser.Physics.Arcade.Image;
      platforms!: Phaser.Physics.Arcade.StaticGroup;
      cursors!: any;
      constructor() {
        super("my-scene");
        this.customConfig = config;
      }
      create() {
        const {player, platforms, gravity} = this.customConfig;
        this.physics.world.gravity.y = gravity;
        this.player = this.physics.add.image(player.x, player.y, undefined)
          .setDisplaySize(50, 50)
          .setTint(player.color)
        this.player.setCollideWorldBounds(true)
        this.cursors = this.input.keyboard!.addKeys({
          up: Phaser.Input.Keyboard.KeyCodes.W,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
        });
        this.platforms = this.physics.add.staticGroup();
        platforms.forEach((p: any) => {
          const plat = this.add.rectangle(p.x, p.y, p.width, p.height, p.color);
          this.physics.add.existing(plat, true);
          this.platforms.add(plat);
        });
        this.physics.add.collider(this.player, this.platforms);
      }
      update() {
        const speed = 200
        const jumpSpeed = -400
        this.player.setVelocity(0)
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed)
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed)
        } else {
            this.player.setVelocityX(0)
        }
        if (this.cursors.up.isDown && this.player.body.touching.down){
            this.player.setVelocityY(jumpSpeed)
        }
      }
    }
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: size.width,
      height: size.height,
      backgroundColor: "#fff",
      parent: gameRef.current!,
      scene: GameScene,
      physics: {
        default: "arcade",
        arcade: {
          gravity: {x: 0, y: config.gravity},
          debug: true
        }
      }
    }
    gameInstance.current = new Phaser.Game(phaserConfig);
  }

  // Effect to run code or default config
  useEffect(() => {
    destroyGame();
    if (size.width > 0 && size.height > 0) {
      if (code && code.includes('parent: gameRef')) {
        try {
          // eslint-disable-next-line no-new-func
          (window as any).__phaserGame = new Function('Phaser', 'gameRef', code)(Phaser, gameRef.current);
        } catch (e) {
          generateGame(configs[configIndex]);
        }
      } else {
        generateGame(configs[configIndex]);
      }
    }
    return () => {
      destroyGame();
    }
  }, [code, configIndex, size.width, size.height]);

  return (
    <div ref={gameRef} style={{ width: "100%", height: "100%" }} />
  );
};