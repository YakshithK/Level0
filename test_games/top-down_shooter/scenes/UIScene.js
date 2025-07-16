// ===========================================
// UI SCENE
// ===========================================
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }
    
    create() {
        // Health bar
        this.healthBar = this.add.graphics();
        this.healthBarBg = this.add.graphics();
        
        // Score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        // Wave text
        this.waveText = this.add.text(16, 50, 'Wave: 1', {
            fontSize: '20px',
            fill: '#ffffff'
        });
        
        // Enemies killed text
        this.killsText = this.add.text(16, 80, 'Kills: 0', {
            fontSize: '20px',
            fill: '#ffffff'
        });
        
        // Instructions
        this.add.text(16, this.sys.game.config.height - 100, 'WASD: Move', {
            fontSize: '16px',
            fill: '#cccccc'
        });
        this.add.text(16, this.sys.game.config.height - 80, 'Mouse: Aim', {
            fontSize: '16px',
            fill: '#cccccc'
        });
        this.add.text(16, this.sys.game.config.height - 60, 'Click: Shoot', {
            fontSize: '16px',
            fill: '#cccccc'
        });
    }
    
    update() {
        const mainScene = this.scene.get('MainScene');
        if (!mainScene || !mainScene.player) return;
        
        // Update health bar
        this.updateHealthBar(mainScene.player.health, mainScene.player.maxHealth);
        
        // Update texts
        this.scoreText.setText('Score: ' + mainScene.score);
        this.waveText.setText('Wave: ' + mainScene.wave);
        this.killsText.setText('Kills: ' + mainScene.enemiesKilled);
    }
    
    updateHealthBar(health, maxHealth) {
        const barWidth = 200;
        const barHeight = 20;
        const x = this.sys.game.config.width - barWidth - 20;
        const y = 20;
        
        // Background
        this.healthBarBg.clear();
        this.healthBarBg.fillStyle(0x000000);
        this.healthBarBg.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
        
        // Health bar
        this.healthBar.clear();
        const healthPercent = health / maxHealth;
        const color = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
        this.healthBar.fillStyle(color);
        this.healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // Health text
        if (this.healthText) this.healthText.destroy();
        this.healthText = this.add.text(x + barWidth/2, y + barHeight/2, `${health}/${maxHealth}`, {
            fontSize: '14px',
            fill: '#ffffff'
        }).setOrigin(0.5);
    }
}