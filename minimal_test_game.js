class DynamicScene extends Phaser.Scene {
  constructor() {
    super({ key: "DynamicScene" });
  }

  create() {
    // Set background
    this.cameras.main.setBackgroundColor('#2d1b1b');
    
    // Create player
    this.player = this.add.rectangle(100, 100, 32, 32, 0xff0000);
    this.physics.add.existing(this.player, false);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setBounce(0.3, 0.3);
    
    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    
    // Add ground
    const ground = this.add.rectangle(400, 590, 800, 20, 0x888888);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
    
    // Add a simple platform
    const platform = this.add.rectangle(300, 400, 200, 20, 0x00ff00);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
    
    // Create enemies as simple rectangles
    this.enemies = [];
    const spike1 = this.add.rectangle(200, 380, 20, 20, 0xff0000);
    this.physics.add.existing(spike1, true);
    this.enemies.push(spike1);
    
    const spike2 = this.add.rectangle(400, 380, 20, 20, 0xff0000);
    this.physics.add.existing(spike2, true);
    this.enemies.push(spike2);
    
    // Create collectibles
    this.collectibles = this.physics.add.group();
    for (let i = 0; i < 3; i++) {
      const collectible = this.add.rectangle(200 + i * 100, 200, 15, 15, 0xffff00);
      this.physics.add.existing(collectible, true);
      this.collectibles.add(collectible);
    }
    
    // Add platform collisions
    this.physics.add.collider(this.player, this.platforms);
    
    // Add collectible overlap
    this.physics.add.overlap(this.player, this.collectibles, this.handleCollectible, null, this);
    
    // Setup controls
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Player state
    this.playerState = {
      health: 3,
      invulnerable: false,
      invulnerabilityTimer: 0,
    };
    
    // Create health text
    this.healthText = this.add.text(10, 10, 'Health: 3', { 
      fontSize: '16px', 
      color: '#ffffff' 
    });
    
    // Create collectible text
    this.collectibleText = this.add.text(10, 30, 'Collectibles: 0/3', { 
      fontSize: '16px', 
      color: '#ffffff' 
    });
    
    this.collectedCount = 0;
  }

  update() {
    const speed = 200;
    const jumpSpeed = -400;
    
    // Update invulnerability timer
    if (this.playerState.invulnerabilityTimer > 0) {
      this.playerState.invulnerabilityTimer--;
      if (this.playerState.invulnerabilityTimer <= 0) {
        this.playerState.invulnerable = false;
        this.player.setAlpha(1);
      }
    }
    
    // Reset velocity
    this.player.body.setVelocityX(0);
    
    // Move left/right
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
    }
    
    // Jump
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    if (jumpPressed && this.player.body.blocked.down) {
      this.player.body.setVelocityY(jumpSpeed);
    }
    
    // Manual enemy collision detection (simplest possible)
    if (!this.playerState.invulnerable) {
      this.enemies.forEach(enemy => {
        if (this.checkCollision(this.player, enemy)) {
          this.handleEnemyCollision();
        }
      });
    }
  }

  checkCollision(rect1, rect2) {
    return (rect1.x - rect1.width/2 < rect2.x + rect2.width/2 &&
            rect1.x + rect1.width/2 > rect2.x - rect2.width/2 &&
            rect1.y - rect1.height/2 < rect2.y + rect2.height/2 &&
            rect1.y + rect1.height/2 > rect2.y - rect2.height/2);
  }

  handleEnemyCollision() {
    console.log('Enemy collision detected!');
    
    // Set invulnerability
    this.playerState.invulnerable = true;
    this.playerState.invulnerabilityTimer = 120; // 2 seconds
    
    // Reduce health
    this.playerState.health--;
    this.healthText.setText('Health: ' + this.playerState.health);
    
    // Visual feedback
    this.player.setAlpha(0.5);
    
    console.log('Health reduced to:', this.playerState.health);
    
    // Check if dead
    if (this.playerState.health <= 0) {
      console.log('Player died, restarting...');
      this.time.delayedCall(1000, () => {
        this.scene.restart();
      });
    }
  }

  handleCollectible(player, collectible) {
    console.log('Collectible collected!');
    
    collectible.destroy();
    this.collectedCount++;
    this.collectibleText.setText('Collectibles: ' + this.collectedCount + '/3');
    
    if (this.collectedCount >= 3) {
      this.add.text(400, 300, 'YOU WIN!', { 
        fontSize: '32px', 
        color: '#00ff00' 
      }).setOrigin(0.5);
    }
  }
} 