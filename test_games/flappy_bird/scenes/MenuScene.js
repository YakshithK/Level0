// scenes/MenuScene.js
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Background
        this.add.rectangle(400, 300, 800, 600, COLORS.SKY);
        
        // Add animated clouds
        for (let i = 0; i < 5; i++) {
            const cloud = this.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(50, 200),
                Phaser.Math.Between(20, 40),
                COLORS.WHITE,
                0.7
            );
            this.tweens.add({
                targets: cloud,
                x: cloud.x + 100,
                duration: Phaser.Math.Between(10000, 15000),
                repeat: -1
            });
        }

        // Ground
        this.add.image(400, 556, 'ground');

        // Title
        this.add.text(400, 200, 'FLAPPY BIRD', {
            fontSize: '64px',
            fill: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // High score
        this.add.text(400, 280, `High Score: ${gameState.highScore}`, {
            fontSize: '32px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Instructions
        this.add.text(400, 350, 'Click or Press SPACE to Start!', {
            fontSize: '24px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Input
        this.input.on('pointerdown', () => this.startGame());
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    }

    startGame() {
        this.scene.start('GameScene');
    }
} 