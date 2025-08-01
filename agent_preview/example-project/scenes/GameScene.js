/**
 * Main game scene with bullet physics and collision detection
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        console.log('GameScene constructor called');
    }
    
    preload() {
        // We'll create textures in create() method instead
    }
    
    create() {
        console.log('GameScene create() called');
        
        // Create textures for sprites
        const playerKey = CONSTANTS ? CONSTANTS.ASSETS.PLAYER : 'player';
        const enemyKey = CONSTANTS ? CONSTANTS.ASSETS.ENEMY : 'enemy';
        const bulletKey = CONSTANTS ? CONSTANTS.ASSETS.BULLET : 'bullet';
        
        // Create player sprite (green rectangle)
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00ff00);
        playerGraphics.fillRect(0, 0, 32, 32);
        playerGraphics.generateTexture(playerKey, 32, 32);
        playerGraphics.destroy();
        
        // Create enemy sprite (red rectangle)
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0xff0000);
        enemyGraphics.fillRect(0, 0, 32, 32);
        enemyGraphics.generateTexture(enemyKey, 32, 32);
        enemyGraphics.destroy();
        
        // Create bullet sprite (yellow rectangle)
        const bulletGraphics = this.add.graphics();
        bulletGraphics.fillStyle(0xffff00);
        bulletGraphics.fillRect(0, 0, 8, 8);
        bulletGraphics.generateTexture(bulletKey, 8, 8);
        bulletGraphics.destroy();
        
        // Background
        console.log('Creating background...');
        this.add.rectangle(400, 300, 800, 600, 0x1a1a2e);
        console.log('Background created');
        
        // Create bullet group for player FIRST
        console.log('Creating bullet group...');
        this.bullets = this.physics.add.group({
            classType: BulletSprite,
            maxSize: 30,
            runChildUpdate: true
        });
        console.log('Bullet group created');
        
        // Create enemy group
        this.enemies = this.physics.add.group({
            classType: EnemySprite,
            maxSize: 20,
            runChildUpdate: true
        });
        
        // Create player AFTER bullet group is created
        console.log('Creating player...');
        this.player = new PlayerSprite(this, 400, 500);
        console.log('Player created');
        
        // Spawn enemies
        const spawnRate = CONSTANTS ? CONSTANTS.ENEMY_SPAWN_RATE : 2000;
        this.enemySpawnTimer = this.time.addEvent({
            delay: spawnRate,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // Set up collision detection
        this.setupCollisions();
        
        // Score
        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        
        // Listen for enemy killed events
        this.events.on('enemyKilled', this.onEnemyKilled, this);
        
        // Game over event
        this.events.on('gameOver', this.onGameOver, this);
    }
    
    update(time, delta) {
        // Update player
        this.player.update(time, delta);
        
        // Update enemies
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                enemy.update(time, delta);
            }
        });
        
        // Update bullets
        this.bullets.children.entries.forEach(bullet => {
            if (bullet.active) {
                bullet.update(time, delta);
            }
        });
    }
    
    /**
     * Spawn a new enemy at random position
     */
    spawnEnemy() {
        const x = Phaser.Math.Between(50, 750);
        const y = Phaser.Math.Between(50, 150);
        
        const enemy = this.enemies.get();
        if (enemy) {
            enemy.setActive(true);
            enemy.setVisible(true);
            enemy.x = x;
            enemy.y = y;
            enemy.health = CONSTANTS ? CONSTANTS.ENEMY_HEALTH : 50;
            enemy.setTint(0xff0000);
        }
    }
    
    /**
     * Set up collision detection between game objects
     */
    setupCollisions() {
        // Player bullets vs enemies
        this.physics.add.overlap(
            this.bullets,
            this.enemies,
            this.handleBulletEnemyCollision,
            null,
            this
        );
        
        // Enemies vs player
        this.physics.add.overlap(
            this.enemies,
            this.player,
            this.handleEnemyPlayerCollision,
            null,
            this
        );
    }
    
    /**
     * Handle collision between bullet and enemy
     * @param {BulletSprite} bullet - The bullet
     * @param {EnemySprite} enemy - The enemy
     */
    handleBulletEnemyCollision(bullet, enemy) {
        if (bullet.active && enemy.active) {
            bullet.onHit(enemy);
        }
    }
    
    /**
     * Handle collision between enemy and player
     * @param {EnemySprite} enemy - The enemy
     * @param {PlayerSprite} player - The player
     */
    handleEnemyPlayerCollision(enemy, player) {
        if (enemy.active && player.active) {
            player.takeDamage(25);
            enemy.die();
        }
    }
    
    /**
     * Handle enemy killed event
     * @param {EnemySprite} enemy - The killed enemy
     */
    onEnemyKilled(enemy) {
        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);
    }
    
    /**
     * Handle game over
     */
    onGameOver() {
        this.scene.start('GameOverScene', { score: this.score, level: 1 });
    }
    
    shutdown() {
        // Clean up timers
        if (this.enemySpawnTimer) {
            this.enemySpawnTimer.destroy();
        }
        
        // Remove event listeners
        this.events.off('enemyKilled', this.onEnemyKilled, this);
        this.events.off('gameOver', this.onGameOver, this);
    }
}