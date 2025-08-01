/**
 * Main menu scene with start game functionality
 */
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
        console.log('MainMenuScene constructor called');
    }
    
    preload() {
        // We'll create textures in create() method instead
    }
    
    create() {
        console.log('MainMenuScene create() called');
        
        // Create textures for sprites
        const playerKey = CONSTANTS ? CONSTANTS.ASSETS.PLAYER : 'player';
        const enemyKey = CONSTANTS ? CONSTANTS.ASSETS.ENEMY : 'enemy';
        const bulletKey = CONSTANTS ? CONSTANTS.ASSETS.BULLET : 'bullet';
        
        // Create player sprite (green rectangle)
        console.log('Creating player texture...');
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00ff00);
        playerGraphics.fillRect(0, 0, 32, 32);
        playerGraphics.generateTexture(playerKey, 32, 32);
        playerGraphics.destroy();
        console.log('Player texture created');
        
        // Create enemy sprite (red rectangle)
        console.log('Creating enemy texture...');
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0xff0000);
        enemyGraphics.fillRect(0, 0, 32, 32);
        enemyGraphics.generateTexture(enemyKey, 32, 32);
        enemyGraphics.destroy();
        console.log('Enemy texture created');
        
        // Create bullet sprite (yellow rectangle)
        console.log('Creating bullet texture...');
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(0xffff00);
        bulletGraphics.fillRect(0, 0, 8, 8);
        bulletGraphics.generateTexture(bulletKey, 8, 8);
        bulletGraphics.destroy();
        console.log('Bullet texture created');
        
        // Background
        console.log('Creating background...');
        this.add.rectangle(400, 300, 800, 600, 0x2c3e50);
        console.log('Background created');
        
        // Title
        const title = this.add.text(400, 200, 'SPACE SHOOTER', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        
        // Start button
        const startButton = this.add.rectangle(400, 350, 200, 50, 0x3498db);
        startButton.setInteractive();
        
        const startText = this.add.text(400, 350, 'START GAME', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        startText.setOrigin(0.5);
        
        // Button hover effects
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x2980b9);
        });
        
        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x3498db);
        });
        
        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
        
        // Keyboard support
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
        
        this.input.keyboard.once('keydown-ENTER', () => {
            this.scene.start('GameScene');
        });
    }
}