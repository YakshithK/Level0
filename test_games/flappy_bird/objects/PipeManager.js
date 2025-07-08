// objects/PipeManager.js
class PipeManager {
    constructor(scene) {
        this.scene = scene;
        this.pipes = scene.physics.add.group();
    }

    generatePipes() {
        const gapSize = GAME_CONFIG.PIPE_GAP;
        const pipeWidth = 52;
        const minPipeHeight = 100;
        const maxPipeHeight = 300;
        
        const topPipeHeight = Phaser.Math.Between(minPipeHeight, maxPipeHeight);
        const bottomPipeHeight = GAME_CONFIG.WORLD_HEIGHT - topPipeHeight - gapSize - GAME_CONFIG.GROUND_HEIGHT;

        // Top pipe
        const topPipe = this.pipes.create(850, topPipeHeight / 2, 'pipe');
        topPipe.setScale(1, topPipeHeight / 320);
        topPipe.setVelocityX(GAME_CONFIG.PIPE_SPEED);
        topPipe.body.setSize(pipeWidth, topPipeHeight);
        topPipe.body.setImmovable(true);
        topPipe.body.setGravityY(-GAME_CONFIG.GRAVITY);

        // Bottom pipe
        const bottomPipe = this.pipes.create(850, GAME_CONFIG.WORLD_HEIGHT - GAME_CONFIG.GROUND_HEIGHT - bottomPipeHeight / 2, 'pipe');
        bottomPipe.setScale(1, bottomPipeHeight / 320);
        bottomPipe.setVelocityX(GAME_CONFIG.PIPE_SPEED);
        bottomPipe.body.setSize(pipeWidth, bottomPipeHeight);
        bottomPipe.body.setImmovable(true);
        bottomPipe.body.setGravityY(-GAME_CONFIG.GRAVITY);
        bottomPipe.scored = false;
    }

    update(bird) {
        // Remove off-screen pipes
        this.pipes.children.entries.forEach((pipe) => {
            if (pipe.x < -50) {
                pipe.destroy();
            }
        });

        // Check for scoring
        this.pipes.children.entries.forEach((pipe) => {
            if (pipe.x < bird.x && !pipe.scored && pipe.texture.key === 'pipe') {
                if (pipe.y > 300) { // Only count bottom pipes
                    gameState.addScore();
                    pipe.scored = true;
                }
            }
        });
    }

    stopAll() {
        this.pipes.children.entries.forEach((pipe) => {
            pipe.setVelocityX(0);
        });
    }

    clear() {
        this.pipes.clear(true, true);
    }
} 