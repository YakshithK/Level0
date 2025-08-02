// ===========================================
// PLAYER CLASS - Main Character Controller
// ===========================================
// This class manages the player character, movement controls, health system
// Handles player input, WASD movement, shooting mechanics, and player stats
// Controls player health, damage taking, movement speed, and collision
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
      super(scene, x, y, 'player');
      
      this.scene = scene;
      this.health = 100;           // Player current health points
      this.maxHealth = 100;        // Maximum player health capacity
      this.speed = 200;            // Player movement speed and velocity
      this.shootCooldown = 0;      // Shooting cooldown timer for fire rate
      this.shootRate = 200;        // Milliseconds between shots/bullets
      
      // Add player to scene and enable physics for movement
      scene.add.existing(this);
      scene.physics.add.existing(this);
      
      // Keep player within game boundaries and add movement physics
      this.setCollideWorldBounds(true);
      this.setDrag(400);           // Movement drag for smooth controls
      
      // Setup input controls for player movement and actions
      this.keys = scene.input.keyboard.createCursorKeys();      // Arrow keys
      this.wasd = scene.input.keyboard.addKeys('W,S,A,D');      // WASD controls
  }
  
  // Main update loop for player character logic
  update(time, delta) {
      this.handleMovement();       // Process player movement input
      this.handleRotation();       // Handle player rotation and facing
      this.handleShooting(time);   // Process shooting input and bullets
  }
  
  // Handle player movement with WASD controls
  handleMovement() {
      const speed = this.speed;    // Get player movement speed
      let velX = 0;                // Horizontal velocity
      let velY = 0;                // Vertical velocity
      
      // WASD movement controls - check key presses
      if (this.wasd.A.isDown) velX = -speed;    // Move left
      if (this.wasd.D.isDown) velX = speed;     // Move right  
      if (this.wasd.W.isDown) velY = -speed;    // Move up
      if (this.wasd.S.isDown) velY = speed;     // Move down
      
      // Apply movement velocity to player
      this.setVelocity(velX, velY);
  }
  
  // Handle player rotation to face mouse cursor
  // Handle player rotation to face mouse cursor
  handleRotation() {
      const pointer = this.scene.input.activePointer;  // Get mouse position
      const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
      this.setRotation(angle);  // Rotate player to face mouse
  }
  
  // Handle player shooting mechanics and fire rate control
  handleShooting(time) {
      // Check if mouse is pressed and cooldown has expired
      if (this.scene.input.activePointer.isDown && time > this.shootCooldown) {
          this.shoot();  // Fire a bullet/shot
          this.shootCooldown = time + this.shootRate;  // Reset cooldown timer
      }
  }
  
  // Create and fire a bullet projectile from player
  shoot() {
      // Create new bullet at player position with current rotation
      const bullet = new Bullet(this.scene, this.x, this.y, this.rotation);
      this.scene.bullets.add(bullet);  // Add to bullet group
      
      // Add bullet to physics world immediately for collision
      this.scene.physics.world.enable(bullet);
      
      // Set bullet velocity and trajectory after enabling physics
      const vel = this.scene.physics.velocityFromRotation(this.rotation, 400);
      bullet.setVelocity(vel.x, vel.y);  // Launch bullet projectile
  }
  
  // Handle player taking damage from enemies or hazards
  takeDamage(amount) {
      this.health -= amount;  // Reduce player health points
      this.scene.cameras.main.shake(100, 0.02);  // Screen shake effect on damage
      
      // Check if player health is depleted - trigger game over
      if (this.health <= 0) {
          this.scene.gameOver();  // End game when player dies
      }
  }
}