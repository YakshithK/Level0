// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: [DynamicScene, GameOverScene, UIScene]
};

// Initialize game
const game = new Phaser.Game(config);

// Global game state
const gameState = {
    score: 0,
    level: 1,
    lives: 3,
    highScore: localStorage.getItem('highScore') || 0
};