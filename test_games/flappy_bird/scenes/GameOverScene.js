// scenes/GameOverScene.js
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        // Background
        this.add.rectangle(400, 300, 800, 600, COLORS.SKY);
        this.add.image(400, 556, 'ground');

        // Game Over title
        this.add.text(400, 200, 'GAME OVER', {
            fontSize: '64px',
            fill: '#FF0000',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Scores
        this.add.text(400, 280, `Score: ${gameState.score}`, {
            fontSize: '32px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 320, `High Score: ${gameState.highScore}`, {
            fontSize: '32px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // New high score message
        if (gameState.score === gameState.highScore && gameState.score > 0) {
            const newHighScoreText = this.add.text(400, 360, 'NEW HIGH SCORE!', {
                fontSize: '24px',
                fill: '#FFD700',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.tweens.add({
                targets: newHighScoreText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        // Restart instructions
        this.add.text(400, 450, 'Click or Press SPACE to Play Again', {
            fontSize: '24px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 500, 'Press M for Main Menu', {
            fontSize: '20px',
            fill: '#000'
        }).setOrigin(0.5);

        // Input
        this.input.on('pointerdown', () => this.restartGame());
        this.input.keyboard.on('keydown-SPACE', () => this.restartGame());
        this.input.keyboard.on('keydown-M', () => this.goToMenu());
    }

    restartGame() {
        this.scene.start('GameScene');
    }

    goToMenu() {
        this.scene.start('MenuScene');
    }
} 