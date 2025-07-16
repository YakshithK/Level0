// ===========================================
// GAME OVER SCENE
// ===========================================
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    create(data) {
        // Background overlay
        this.add.rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height, 0x000000, 0.7)
            .setOrigin(0);
        
        // Game Over text
        this.add.text(this.sys.game.config.width/2, 200, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Stats
        this.add.text(this.sys.game.config.width/2, 280, `Final Score: ${data.score}`, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(this.sys.game.config.width/2, 320, `Wave Reached: ${data.wave}`, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
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