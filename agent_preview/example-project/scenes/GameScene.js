class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.score = 0;
        this.scoreText = null;
    }
    
    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 800, 600);
        
        // Create player
        this.player = new Player(this, 400, 300);
        
        // Create coins group
        this.coins = this.physics.add.group();
        
        // Spawn initial coins
        this.spawnCoins();
        
        // Set up collision between player and coins
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        
        // Create score display
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        // Create high score display
        this.highScoreText = this.add.text(16, 56, 'High Score: ' + this.getHighScore(), {
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        // Timer to spawn new coins
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnCoins,
            callbackScope: this,
            loop: true
        });
    }
    
    update() {
        this.player.update();
    }
    
    spawnCoins() {
        // Spawn 3-5 coins randomly
        const numCoins = Phaser.Math.Between(3, 5);
        
        for (let i = 0; i < numCoins; i++) {
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 550);
            const coin = new Coin(this, x, y);
            this.coins.add(coin);
        }
    }
    
    collectCoin(player, coin) {
        // Play collect animation
        coin.collect();
        
        // Update score
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        
        // Check for new high score
        if (this.score > this.getHighScore()) {
            this.setHighScore(this.score);
            this.highScoreText.setText('High Score: ' + this.score);
        }
        
        // Create floating score text
        const floatingText = this.add.text(coin.x, coin.y, '+10', {
            fontSize: '24px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        
        this.tweens.add({
            targets: floatingText,
            y: coin.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => floatingText.destroy()
        });
    }
    
    getHighScore() {
        return parseInt(localStorage.getItem('highScore') || '0');
    }
    
    setHighScore(score) {
        localStorage.setItem('highScore', score.toString());
    }
}