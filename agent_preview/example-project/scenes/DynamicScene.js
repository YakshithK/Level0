class DynamicScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DynamicScene' });
        
        this.player = null;
        this.enemies = null;
        this.bullets = null;
        this.platforms = null;
        this.cursors = null;
        this.score = 0;
        this.gameOver = false;
    }
    
    preload() {
        // Load assets
        this.load.image('player', 'assets/player.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('platform', 'assets/platform.png');
        this.load.image('particle', 'assets/particle.png');
        
        // Load spritesheets for animations
        this.load.spritesheet('player-run', 'assets/player-run.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }
    
    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, 800, 600);
        
        // Create groups
        this.platforms = this.physics.add.staticGroup();
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        
        // Create platforms
        this.createPlatforms();
        
        // Create player
        this.player = new Player(this, 100, 450);
        
        // Create enemies
        this.createEnemies();
        
        // Set up collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.bullets, this.platforms, this.bulletHitPlatform, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitEnemy, null, this);
        
        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Create animations
        this.createAnimations();
        
        // Set up UI events
        this.events.on('scoreChanged', (score) => {
            this.score = score;
        });
        
        this.events.on('playerDied', () => {
            this.gameOver = true;
            this.scene.start('GameOverScene', { score: this.score });
        });
    }
    
    update(time, delta) {
        if (this.gameOver) return;
        
        // Update player
        this.player.update();
        
        // Update enemies
        this.enemies.children.entries.forEach(enemy => {
            if (enemy.update) enemy.update();
        });
        
        // Update bullets
        this.bullets.children.entries.forEach(bullet => {
            if (bullet.update) bullet.update();
        });
    }
    
    createPlatforms() {
        // Create ground
        for (let i = 0; i < 800; i += 32) {
            this.platforms.create(i + 16, 584, 'platform');
        }
        
        // Create some floating platforms
        this.platforms.create(400, 400, 'platform');
        this.platforms.create(200, 300, 'platform');
        this.platforms.create(600, 250, 'platform');
    }
    
    createEnemies() {
        // Create enemies at various positions
        const enemyPositions = [
            { x: 300, y: 350 },
            { x: 500, y: 200 },
            { x: 700, y: 500 }
        ];
        
        enemyPositions.forEach(pos => {
            const enemy = new Enemy(this, pos.x, pos.y);
            this.enemies.add(enemy);
        });
    }
    
    createAnimations() {
        // Player run animation
        this.anims.create({
            key: 'player-run',
            frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    }
    
    bulletHitPlatform(bullet, platform) {
        bullet.destroy();
    }
    
    bulletHitEnemy(bullet, enemy) {
        bullet.onHit(enemy);
        this.score += 10;
        this.events.emit('scoreChanged', this.score);
    }
    
    playerHitEnemy(player, enemy) {
        player.takeDamage(20);
        this.events.emit('healthChanged', player.health);
    }
}