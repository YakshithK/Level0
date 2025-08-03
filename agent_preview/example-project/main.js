// ===========================================
// MAIN GAME CONFIGURATION
// ===========================================
class Game {
    constructor() {
        this.config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            backgroundColor: '#2c3e50',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: [MainScene, UIScene, GameOverScene]
        };
        
        this.game = new Phaser.Game(this.config);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});