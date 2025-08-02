// ===========================================
// MAIN SCENE - Core Game Logic and Management
// ===========================================
// This class manages the main gameplay, scene setup, and game state
// Handles player creation, enemy spawning, collision detection, and UI
// Controls shooting mechanics, wave progression, score system, and game flow
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }
    
    // Preload all game assets - sprites, images, and textures
    preload() {
        // Load sprite images for game entities
        this.load.image('player', 'assets/sprites/player.png');    // Player character sprite
        this.load.image('enemy', 'assets/sprites/enemy.png');      // Enemy character sprite  
        this.load.image('bullet', 'assets/sprites/bullet.png');    // Bullet projectile sprite
    }
    
    // Create and initialize all game objects and systems
    create() {
        // Initialize game state variables and scoring system
        this.score = 0;          // Player score counter
        this.wave = 1;           // Current wave number
        this.enemiesKilled = 0;  // Enemies defeated counter
        
        // Create player character at center of screen
        this.player = new Player(this, 400, 300);
        
        // Create physics groups for game entities and collision management
        this.bullets = this.physics.add.group({
            classType: Bullet,           // Use Bullet class for projectiles
            runChildUpdate: true         // Auto-update bullet movements
        });
        
        // Create enemy group for hostile AI entities
        this.enemies = this.physics.add.group({
            classType: Enemy,            // Use Enemy class for hostile entities
            runChildUpdate: true         // Auto-update enemy AI behavior
        });
        
        // Setup collision detection systems for combat mechanics
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);    // Bullets hit enemies
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);     // Player hit by enemies
        
        // Start UI scene for score display and game interface
        this.scene.launch('UIScene');
        
        // Start enemy spawner system - creates enemies at intervals
        this.enemySpawner = this.time.addEvent({
            delay: 2000,                 // Spawn every 2 seconds
            callback: this.spawnEnemies, // Function to create new enemies
            callbackScope: this,         // Context for spawner
            loop: true                   // Repeat continuously
        });
        
        // Wave progression system - increases difficulty over time
        this.time.addEvent({
            delay: 30000,                // 30 seconds per wave
            callback: this.nextWave,     // Advance to next wave
            callbackScope: this,
            loop: true
        });
    }
    
    update(time, delta) {
        this.player.update(time, delta);
        
        // Update bullets
        this.bullets.children.entries.forEach(bullet => {
            bullet.update();
        });
    }
    
    spawnEnemies() {
        const numEnemies = Math.min(this.wave + 2, 8);
        console.log('Player position:', this.player.x, this.player.y);
        for (let i = 0; i < numEnemies; i++) {
            const side = Phaser.Math.Between(0, 3);
            let x, y;
            switch (side) {
                case 0: // Top
                    x = Phaser.Math.Between(0, this.sys.game.config.width);
                    y = -50;
                    break;
                case 1: // Right
                    x = this.sys.game.config.width + 50;
                    y = Phaser.Math.Between(0, this.sys.game.config.height);
                    break;
                case 2: // Bottom
                    x = Phaser.Math.Between(0, this.sys.game.config.width);
                    y = this.sys.game.config.height + 50;
                    break;
                case 3: // Left
                    x = -50;
                    y = Phaser.Math.Between(0, this.sys.game.config.height);
                    break;
            }
            const enemy = new Enemy(this, x, y);
            this.enemies.add(enemy);
        }
    }
    
    bulletHitEnemy(bullet, enemy) {
        enemy.takeDamage(bullet.damage);
        bullet.destroy();
        
        if (enemy.health <= 0) {
            this.enemiesKilled++;
        }
    }
    
    playerHitEnemy(player, enemy) {
        const currentTime = this.time.now;
        if (currentTime > enemy.lastAttack + enemy.attackRate) {
            player.takeDamage(enemy.damage);
            enemy.lastAttack = currentTime;
        }
    }
    
    nextWave() {
        this.wave++;
        this.cameras.main.flash(200, 255, 255, 255);
    }
    
    gameOver() {
        this.scene.pause();
        this.scene.launch('GameOverScene', { 
            score: this.score, 
            wave: this.wave,
            enemiesKilled: this.enemiesKilled 
        });
    }
}