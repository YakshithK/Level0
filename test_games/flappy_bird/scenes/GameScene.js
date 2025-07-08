// scenes/GameScene.js
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Reset game state
        gameState.reset();

        // Background
        this.add.rectangle(400, 300, 800, 600, COLORS.SKY);
        
        // Add clouds
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
        this.ground = this.physics.add.staticGroup();
        this.ground.create(400, 556, 'ground');

        // Bird
        this.bird = new Bird(this, 100, 300);

        // Pipe manager
        this.pipeManager = new PipeManager(this);

        // Collisions
        this.physics.add.collider(this.bird, this.ground, this.hitObstacle, null, this);
        this.physics.add.collider(this.bird, this.pipeManager.pipes, this.hitObstacle, null, this);

        // UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#000',
            fontStyle: 'bold'
        });

        this.instructionText = this.add.text(400, 300, 'Click or Press SPACE to Flap!', {
            fontSize: '24px',
            fill: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Input
        this.input.on('pointerdown', this.flap, this);
        this.input.keyboard.on('keydown-SPACE', this.flap, this);

        // Pipe generation timer
        this.pipeTimer = this.time.addEvent({
            delay: GAME_CONFIG.PIPE_SPAWN_DELAY,
            callback: () => this.pipeManager.generatePipes(),
            loop: true
        });
    }

    update() {
        if (gameState.gameOver) return;

        if (gameState.gameStarted) {
            this.bird.update();
            this.pipeManager.update(this.bird);
            this.scoreText.setText(`Score: ${gameState.score}`);
        }
    }

    flap() {
        if (!gameState.gameStarted) {
            gameState.startGame();
            this.instructionText.setVisible(false);
        }

        if (!gameState.gameOver) {
            this.bird.flap();
        }
    }

    hitObstacle() {
        if (!gameState.gameOver) {
            gameState.setGameOver();
            this.bird.setVelocity(0, 0);
            this.pipeManager.stopAll();
            this.pipeTimer.remove();
            
            // Transition to game over scene
            this.time.delayedCall(500, () => {
                this.scene.start('GameOverScene');
            });
        }
    }
} 