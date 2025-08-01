/**
 * Game over scene showing final score and restart options
 */
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
        console.log('GameOverScene constructor called');
    }
    
    init(data) {
        this.finalScore = data.score || 0;
        this.finalLevel = data.level || 1;
    }
    
    create() {
        // Background
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
        
        const fontFamily = CONSTANTS ? CONSTANTS.FONTS.MAIN : 'Arial';
        
        // Game Over text
        this.add.text(400, 150, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: fontFamily,
            color: '#e74c3c',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Final score
        this.add.text(400, 250, `Final Score: ${this.finalScore}`, {
            fontSize: '32px',
            fontFamily: fontFamily,
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // High score (simplified for now)
        this.add.text(400, 300, `Score: ${this.finalScore}`, {
            fontSize: '24px',
            fontFamily: fontFamily,
            color: '#cccccc'
        }).setOrigin(0.5);
        
        // Level reached
        this.add.text(400, 340, `Level: ${this.finalLevel}`, {
            fontSize: '20px',
            fontFamily: fontFamily,
            color: '#cccccc'
        }).setOrigin(0.5);
        
        // Restart button
        const restartButton = this.add.text(400, 420, 'PLAY AGAIN', {
            fontSize: '28px',
            fontFamily: fontFamily,
            color: '#ffffff',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        
        // Menu button
        const menuButton = this.add.text(400, 480, 'MAIN MENU', {
            fontSize: '24px',
            fontFamily: fontFamily,
            color: '#ffffff',
            backgroundColor: '#3498db',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        
        // Button interactions
        restartButton.on('pointerover', () => {
            restartButton.setScale(1.1);
            restartButton.setBackgroundColor('#219653');
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setScale(1);
            restartButton.setBackgroundColor('#27ae60');
        });
        
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        menuButton.on('pointerover', () => {
            menuButton.setScale(1.1);
            menuButton.setBackgroundColor('#2980b9');
        });
        
        menuButton.on('pointerout', () => {
            menuButton.setScale(1);
            menuButton.setBackgroundColor('#3498db');
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.start('MainMenuScene');
        });
        
        // Keyboard shortcuts
        this.input.keyboard.once('keydown-R', () => {
            this.scene.start('GameScene');
        });
        
        this.input.keyboard.once('keydown-M', () => {
            this.scene.start('MainMenuScene');
        });
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}