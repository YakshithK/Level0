const config = {
    type: Phaser.AUTO,
    width: CONSTANTS ? CONSTANTS.GAME_WIDTH : 800,
    height: CONSTANTS ? CONSTANTS.GAME_HEIGHT : 600,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: []
};

// Add error handling
window.addEventListener('error', function(e) {
    console.error('Game Error:', e.error);
});

// Check if all required classes are available
console.log('Checking required classes:');
console.log('Phaser:', typeof Phaser);
console.log('MainMenuScene:', typeof MainMenuScene);
console.log('GameScene:', typeof GameScene);
console.log('GameOverScene:', typeof GameOverScene);
console.log('CONSTANTS:', typeof CONSTANTS);

// Only create game if all required classes are available
if (typeof Phaser !== 'undefined' && 
    typeof MainMenuScene !== 'undefined' && 
    typeof GameScene !== 'undefined' && 
    typeof GameOverScene !== 'undefined') {
    console.log('All classes available, creating game...');
    
    // Create config with all scenes
    const gameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#2c3e50',
        scene: [MainMenuScene, GameScene, GameOverScene]
    };
    
    console.log('About to create Phaser.Game with full config');
    try {
        const game = new Phaser.Game(gameConfig);
        console.log('Game created successfully with full config');
    } catch (error) {
        console.error('Error creating game:', error);
    }
} else {
    console.error('Missing required classes!');
    console.error('Phaser:', typeof Phaser);
    console.error('MainMenuScene:', typeof MainMenuScene);
    console.error('GameScene:', typeof GameScene);
    console.error('GameOverScene:', typeof GameOverScene);
}