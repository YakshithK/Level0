class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data) {
        this.finalScore = data.score || 0;
    }
    
    create() {
        // Game over text
        this.add.text(400, 200, 'Game Over', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Score text
        this.add.text(400, 280, `Final Score: ${this.finalScore}`, {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // High score text
        const highScore = localStorage.getItem('highScore') || 0;
        if (this.finalScore > highScore) {
            localStorage.setItem('highScore', this.finalScore);
            this.add.text(400, 320, 'New High Score!', {
                fontSize: '20px',
                fill: '#ffff00',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        } else {
            this.add.text(400, 320, `High Score: ${highScore}`, {
                fontSize: '20px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        }
        
        // Restart instruction
        this.add.text(400, 400, 'Press SPACE to restart', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        // Set up input
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
    
    update() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.scene.start('DynamicScene');
        }
    }
}