// ===========================================
// GAME OVER SCENE - End Game Screen and Restart
// ===========================================
// This class manages the game over screen, final statistics, and restart functionality
// Handles end game display, score summary, player stats, and game restart options
// Controls game over UI, final results, and transition back to main menu
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    // Create game over screen with final statistics and restart options
    create(data) {
        // Semi-transparent background overlay for game over screen
        this.add.rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height, 0x000000, 0.7)
            .setOrigin(0);  // Dark overlay for dramatic effect
        
        // Main game over title text - large and prominent
        this.add.text(this.sys.game.config.width/2, 200, 'GAME OVER', {
            fontSize: '48px',           // Large title text
            fill: '#ff0000',            // Red color for game over
            fontStyle: 'bold'           // Bold styling for impact
        }).setOrigin(0.5);  // Center alignment
        
        // Player final statistics display
        this.add.text(this.sys.game.config.width/2, 280, `Final Score: ${data.score}`, {
            fontSize: '24px',           // Medium text for readability
            fill: '#ffffff'             // White color for visibility
        }).setOrigin(0.5);  // Center alignment
        
        this.add.text(this.sys.game.config.width/2, 320, `Wave Reached: ${data.wave}`, {
            fontSize: '24px',           // Medium text for readability
            fill: '#ffffff'             // White color for visibility
        }).setOrigin(0.5);  // Center alignment
        
        this.add.text(this.sys.game.config.width/2, 360, `Enemies Killed: ${data.enemiesKilled}`, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Restart button
        const restartBtn = this.add.text(this.sys.game.config.width/2, 450, 'RESTART', {
            fontSize: '32px',
            fill: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive();
        
        restartBtn.on('pointerdown', () => {
            this.scene.stop('UIScene');
            this.scene.stop('GameOverScene');
            this.scene.start('MainScene');
        });
        
        restartBtn.on('pointerover', () => {
            restartBtn.setTint(0x66ff66);
        });
        
        restartBtn.on('pointerout', () => {
            restartBtn.clearTint();
        });
        
        // Restart with spacebar
        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.stop('UIScene');
            this.scene.stop('GameOverScene');
            this.scene.start('MainScene');
        });
        
        this.add.text(this.sys.game.config.width/2, 500, 'Press SPACE or click RESTART to play again', {
            fontSize: '18px',
            fill: '#cccccc'
        }).setOrigin(0.5);
    }
}