import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

export const PhaserGame: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({width: 400, height: 300})

  useEffect(() => {
    if (!gameRef.current) return;
    function updateSize() {
        if (gameRef.current) {
            setSize({
                width: gameRef.current.offsetWidth,
                height: gameRef.current.offsetHeight
            });
        }
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, []);

  useEffect(() => {
    if (!gameRef.current) return;

    class MyScene extends Phaser.Scene {
      player!: Phaser.GameObjects.Rectangle;
      cursors!: { [key: string]: Phaser.Input.Keyboard.Key };

      constructor() {
        super("my-scene");
      }

      create() {
        this.player = this.physics.add.image(200, 150, undefined)
            .setDisplaySize(50, 50)
            .setTint(0x39ff14)

        this.player.setCollideWorldBounds(true)
        
        this.cursors = this.input.keyboard!.addKeys({
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
        }) as { [key: string]: Phaser.Input.Keyboard.Key };

        this.platforms = this.physics.add.staticGroup()

        const ground = this.add.rectangle(200, 300, 400, 40, 0xff0000)
        this.physics.add.existing(ground, true)
        this.platforms.add(ground)

        const floating = this.add.rectangle(300, 200, 100, 20, 0xff0000)
        this.physics.add.existing(floating, true)
        this.platforms.add(floating)

        this.physics.add.collider(this.player, this.platforms)
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
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: size.width,
      height: size.height,
      backgroundColor: "#fff",
      parent: gameRef.current,
      scene: MyScene,
      physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 600},
            debug: true
        }
      }
    };

    const game = new Phaser.Game(config);

    game.scale.resize(size.width, size.height)

    return () => {
      game.destroy(true);
    };
  }, [size.width, size.height]);

  return <div ref={gameRef} style={{width: "100%", height: "100%"}}/>;
};