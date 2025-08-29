class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        // UI elements will be created here
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '16px',
            fill: '#ffffff'
        });

        this.healthText = this.add.text(16, 40, 'Health: 100', {
            fontSize: '16px',
            fill: '#ffffff'
        });

        // Listen for game events
        this.scene.get('MainScene').events.on('updateScore', (score) => {
            this.scoreText.setText('Score: ' + score);
        });

        this.scene.get('MainScene').events.on('updateHealth', (health) => {
            this.healthText.setText('Health: ' + health);
        });
    }
}