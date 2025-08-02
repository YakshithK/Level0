// ===========================================
// MAIN GAME CONFIGURATION - Core Game Setup
// ===========================================
// This class initializes the Phaser game engine and configures all settings
// Manages game window, physics system, scene management, and game startup
// Controls canvas rendering, arcade physics, and scene transitions
class Game {
    constructor() {
        // Phaser game configuration object - defines core game settings
        this.config = {
            type: Phaser.AUTO,               // Auto-detect WebGL or Canvas rendering
            width: 800,                      // Game window width in pixels
            height: 600,                     // Game window height in pixels
            parent: 'game-container',        // HTML container element ID
            backgroundColor: '#2c3e50',      // Default background color
            physics: {
                default: 'arcade',           // Use Arcade physics system
                arcade: {
                    gravity: { y: 0 },       // No gravity (top-down game)
                    debug: false             // Hide physics debug visuals
                }
            },
            scene: [MainScene, UIScene, GameOverScene]  // Game scenes in load order
        };
        
        // Initialize and start the Phaser game instance
        this.game = new Phaser.Game(this.config);
    }
}

// Start the game when page loads - game initialization entry point
window.addEventListener('load', () => {
    new Game();  // Create and launch the game
});