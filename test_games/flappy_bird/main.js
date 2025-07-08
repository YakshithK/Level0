// main.js - Game configuration and initialization
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.WORLD_WIDTH,
    height: GAME_CONFIG.WORLD_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLORS.SKY,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: GAME_CONFIG.GRAVITY },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

// Initialize game
const game = new Phaser.Game(config);
