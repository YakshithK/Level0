export function generatePhaserCode(configIndex) {

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

    const config = configs[configIndex]
    return `
    const config = {
        console.log("")
        parent: gameRef,
        type: Phaser.AUTO,
        width: 400,
        height: 300,
        backgroundColor: "#fff",
        physics: {
            default: "arcade",
            arcade: {
                gravity: {y: ${config.gravity}},
                debug: true
            }
        },
        scene: {
            create() {
                // Player
                const player = this.physics.add.image(${config.player.x}, ${config.player.y}, undefined)
                    .setDisplaySize(50, 50)
                    .setTint(${config.player.color});
                player.setCollideWorldBounds(true);

                // Platforms
                const platforms = this.physics.add.staticGroup();
${config.platforms.map(
    p => `      platforms.create(${p.x}, ${p.y}, null).setDisplaySize(${p.width}, ${p.height}).setTint(${p.color});`
).join('\n')}
      this.physics.add.collider(player, platforms);

                // Controls (WASD)
                this.cursors = this.input.keyboard.addKeys({
                  up: Phaser.Input.Keyboard.KeyCodes.W,
                  left: Phaser.Input.Keyboard.KeyCodes.A,
                  right: Phaser.Input.Keyboard.KeyCodes.D,
                });
                this.player = player;
            },
            update() {
                const speed = 200;
                const jumpSpeed = -400;
                this.player.setVelocity(0);
                if (this.cursors.left.isDown) {
                  this.player.setVelocityX(-speed);
                } else if (this.cursors.right.isDown) {
                  this.player.setVelocityX(speed);
                } else {
                  this.player.setVelocityX(0);
                }
                if (this.cursors.up.isDown && this.player.body.touching.down) {
                  this.player.setVelocityY(jumpSpeed);
                }
            }
        }
    };
    window.__phaserGame = new Phaser.Game(config);
`.trim();
}