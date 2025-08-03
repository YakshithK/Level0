// ===========================================
// MAIN SCENE
// ===========================================
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }
    
    preload() {
        // Load sprite images
        this.load.image('player', 'assets/sprites/player.png');
        this.load.image('enemy', 'assets/sprites/enemy.png');
        this.load.image('bullet', 'assets/sprites/bullet.png');
    }
    
    create() {
        // Initialize game state
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        
        // Create player
        this.player = new Player(this, 400, 300);
        
        // Create groups
        this.bullets = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });
        
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
        
        // Setup collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        
        // Start UI scene
        this.scene.launch('UIScene');
        
        // Start enemy spawner
        this.enemySpawner = this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemies,
            callbackScope: this,
            loop: true
        });
        
        // Wave system
        this.time.addEvent({
            delay: 30000, // 30 seconds per wave
            callback: this.nextWave,
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