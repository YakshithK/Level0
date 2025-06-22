class DynamicScene extends Phaser.Scene {
  constructor() {
    super({ key: "DynamicScene" });
  }

  create() {
    // Set background
    this.cameras.main.setBackgroundColor('#2d1b1b');
    
    // Create player
    this.player = this.add.rectangle(100, 100, 32, 32, 16739125);
    this.physics.add.existing(this.player, false);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setBounce(0.3, 0.3);
    
    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group();
    
    // Add left wall
    const leftWall = this.add.rectangle(10, 300, 20, 600, 0x888888);
    this.physics.add.existing(leftWall, true);
    this.platforms.add(leftWall);
    // Add right wall (move to x=800)
    const rightWall = this.add.rectangle(800, 300, 20, 600, 0x888888);
    this.physics.add.existing(rightWall, true);
    this.platforms.add(rightWall);
    // Add ground
    const ground = this.add.rectangle(400, 590, 800, 20, 0x888888);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
    
    // Static platform 0 (ground platform - always static)
    const platform0 = this.add.rectangle(100, 500, 150.13868031378135, 20, 2263842);
    this.physics.add.existing(platform0, true);
    platform0.type = 'solid';
    this.platforms.add(platform0);
    
    // Moving platform 1
    const platform1 = this.add.rectangle(197.45211968322923, 370.62749939493176, 130.18829352611593, 20, 3329330);
    this.physics.add.existing(platform1, false);
    platform1.body.setAllowGravity(false);
    platform1.body.setVelocityX(0);
    platform1.body.setBounceX(1);
    platform1.body.setCollideWorldBounds(false);
    platform1.type = 'moving';
    platform1.moveDirection = 1;
    platform1.startX = 197.45211968322923;
    platform1.startY = 370.62749939493176;
    platform1.moveRange = 200;
    platform1.moveSpeed = 2;
    this.movingPlatforms.add(platform1);
    
    // Static platform 2
    const platform2 = this.add.rectangle(53.7234059376569, 430.9780320267465, 198.61405059403404, 20, 25600);
    this.physics.add.existing(platform2, true);
    platform2.type = 'solid';
    this.platforms.add(platform2);
    
    // Create enemies as a group
    this.enemies = this.physics.add.group();
    const spike0 = this.add.rectangle(102.21340643933156, 480, 20, 20, 9127187);
    this.physics.add.existing(spike0, true);
    this.enemies.add(spike0);
    const spike1 = this.add.rectangle(302.83041932085735, 396.074667980611, 20, 20, 9127187);
    this.physics.add.existing(spike1, true);
    this.enemies.add(spike1);
    const spike2 = this.add.rectangle(115.76670491205115, 318.19329390481334, 20, 20, 9127187);
    this.physics.add.existing(spike2, true);
    this.enemies.add(spike2);
    
    // Create projectiles group for shooting
    this.projectiles = this.physics.add.group();
    
    // Create bullet array to track bullets manually
    this.bullets = [];
    
    // Collectible goal
    this.collectibles = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
      const collectible = this.add.rectangle(300 + i * 100, 200 + i * 50, 15, 15, 0xffff00);
      this.physics.add.existing(collectible, true);
      this.collectibles.add(collectible);
    }
    this.physics.add.overlap(this.player, this.collectibles, this.handleCollectible, null, this);
    this.collectedCount = 0;
    this.collectibleText = this.add.text(10, 10, 'Collectibles: 0/5', { color: '#ffffff' });
    
    // Add platform collisions only
    this.physics.add.collider(this.player, this.platforms, this.handlePlatformCollision, null, this);
    this.physics.add.collider(this.player, this.movingPlatforms, this.handlePlatformCollision, null, this);
    
    // Use overlap for enemy detection instead of collider
    this.physics.add.overlap(this.player, this.enemies, this.handleEnemyOverlap, null, this);
    
    // Add enemy-platform collisions so enemies don't phase through platforms
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.movingPlatforms);
    
    // Ensure moving platforms are solid for player collision
    this.movingPlatforms.children.entries.forEach(platform => {
      if (platform.type === 'moving') {
        platform.body.setAllowGravity(false);
        platform.body.setImmovable(true);
        platform.body.setCollideWorldBounds(false);
      }
    });
    
    // Add projectile collisions
    this.physics.add.collider(this.projectiles, this.enemies, this.handleProjectileHit, null, this);
    this.physics.add.collider(this.projectiles, this.platforms, this.handleProjectileWall, null, this);
    
    // Setup controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      x: Phaser.Input.Keyboard.KeyCodes.X
    });
    
    // Player state
    this.playerState = {
      isOnWall: false,
      wallJumpCooldown: 0,
      canDoubleJump: false,
      canDash: false,
      canShoot: true,
      shootCooldown: 0,
      canWallJump: false,
      wallJumpLockDir: null, // 'left' or 'right'
      wallJumpLockTimer: 0,
      facing: 'right', // Track which way the player is facing
      health: 3, // Player has 3 lives
      invulnerable: false, // Add invulnerability after taking damage
      invulnerabilityTimer: 0, // Timer for invulnerability
    };
    
    // Create health bar (always displayed)
    this.healthBar = this.add.rectangle(100, 30, 200, 20, 0x333333);
    this.healthBar.setOrigin(0, 0);
    this.healthBar.setStrokeStyle(2, 0xffffff);
    this.healthText = this.add.text(10, 10, 'Health: 3', { 
      fontSize: '16px', 
      color: '#ffffff' 
    });
  }

  update() {
    const speed = 200;
    const jumpSpeed = -400;
    
    // Update invulnerability timer
    if (this.playerState.invulnerabilityTimer > 0) {
      this.playerState.invulnerabilityTimer--;
      if (this.playerState.invulnerabilityTimer <= 0) {
        this.playerState.invulnerable = false;
        this.player.setAlpha(1); // Make sure player is fully visible
      }
    }
    
    // Reset velocity
    this.player.body.setVelocityX(0);
    
    // Get input state
    const left = this.cursors.left.isDown || this.wasd.a.isDown;
    const right = this.cursors.right.isDown || this.wasd.d.isDown;
    const shoot = this.cursors.shift.isDown || this.wasd.x.isDown;
    
    // Move left/right
    if (left) {
      this.player.body.setVelocityX(-speed);
      this.playerState.facing = 'left';
    } else if (right) {
      this.player.body.setVelocityX(speed);
      this.playerState.facing = 'right';
    }
    
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.w);
    if (jumpPressed && (this.player.body.blocked.down || this.isOnMovingPlatform())) {
      this.player.body.setVelocityY(jumpSpeed);
    }
      
    // --- SHOOTING LOGIC START ---
    if (this.playerState.shootCooldown > 0) {
      this.playerState.shootCooldown--;
    }
    const shootPressed = this.cursors.space.isDown || this.wasd.x.isDown;
    if (shootPressed && this.playerState.shootCooldown === 0) {
      this.createBullet();
      this.playerState.shootCooldown = 10; // Reduced cooldown for continuous shooting
    }
    
    // Update bullets manually
    this.updateBullets();
    // --- SHOOTING LOGIC END ---

    // Spike enemy 0 - static, no update needed
    // Spike enemy 1 - static, no update needed
    // Spike enemy 2 - static, no update needed
    this.updatePlatforms();
    if (!this.debugText) {
      this.debugText = this.add.text(10, 30, '', { color: '#fff' });
    }
  }

  handleEnemyOverlap(player, enemy) {
    // Use overlap instead of collision - this should be more stable
    if (this.playerState.invulnerable) {
      return;
    }
    
    // Set invulnerability immediately
    this.playerState.invulnerable = true;
    this.playerState.invulnerabilityTimer = 120;
    
    // Handle damage
    this.playerState.health--;
    
    console.log('Enemy overlap! Health:', this.playerState.health);
    
    // Update UI
    if (this.healthText) {
      this.healthText.setText('Health: ' + this.playerState.health);
    }
    
    if (this.healthBar) {
      const healthPercentage = Math.max(0, this.playerState.health / 3);
      this.healthBar.width = 200 * healthPercentage;
      
      if (this.playerState.health >= 3) {
        this.healthBar.fillColor = 0x00ff00;
      } else if (this.playerState.health >= 2) {
        this.healthBar.fillColor = 0xffff00;
      } else {
        this.healthBar.fillColor = 0xff0000;
      }
    }
    
    // Visual feedback
    if (this.player && this.tweens) {
      this.tweens.add({
        targets: this.player,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: 5
      });
    }
    
    // Check death
    if (this.playerState.health <= 0) {
      console.log('Player died, restarting...');
      this.time.delayedCall(1000, () => {
        this.scene.restart();
      });
    }
  }

  // ... rest of the methods remain the same as in updated_game_code.js ...
} 