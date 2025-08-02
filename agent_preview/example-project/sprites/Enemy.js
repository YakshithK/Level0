// ===========================================
// ENEMY CLASS - Hostile AI Entities
// ===========================================
// This class manages enemy AI behavior, health system, and combat mechanics
// Handles enemy movement patterns, player chasing, damage taking, and death
// Controls enemy health, attack patterns, collision damage, and AI behavior
class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
      super(scene, x, y, 'enemy');
      
      this.scene = scene;
      this.health = 50;           // Enemy health points and hit points
      this.speed = 80;            // Enemy movement speed and chase velocity
      this.damage = 20;           // Damage dealt to player on contact
      this.lastAttack = 0;        // Timer for attack cooldown
      this.attackRate = 1000;     // Milliseconds between enemy attacks
      
      // Add enemy to scene and enable physics for movement and collision
      scene.add.existing(this);
      scene.physics.add.existing(this);
      
      // Keep enemy within game boundaries with physics properties
      this.setCollideWorldBounds(true);
      this.setBounce(0.2);        // Slight bounce on collision
  }
  
  // Main enemy update loop for AI behavior
  update(time) {
      this.chasePlayer();         // Execute player chasing AI
  }
  
  // AI behavior for chasing and following the player
  chasePlayer() {
      const player = this.scene.player;  // Get reference to player
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      
      // Move towards player if not too close, stop if within attack range
      if (distance > 20) {
          this.scene.physics.moveToObject(this, player, this.speed);  // Chase player
      } else {
          this.setVelocity(0, 0);  // Stop moving when close enough to attack
      }
  }
  
  // Handle enemy taking damage from bullets or player attacks
  takeDamage(amount) {
      this.health -= amount;      // Reduce enemy health points
      
      // Visual feedback - flash red when taking damage
      this.setTint(0xff6666);     // Red tint effect
      this.scene.time.delayedCall(100, () => {
          this.clearTint();       // Remove tint after brief delay
      });
      
      // Check if enemy health is depleted - trigger death
      if (this.health <= 0) {
          this.die();             // Execute death sequence
      }
  }
  
  // Handle enemy death and destruction
  die() {
      // Death explosion effect and score increase
      this.createExplosion();     // Visual death effect
      this.scene.score += 10;     // Increase player score
      this.destroy();             // Remove enemy from game
  }
  
  // Create visual explosion effect when enemy dies
  createExplosion() {
      // Create explosion effect using bullet texture as particles
      const particles = this.scene.add.particles(this.x, this.y, 'bullet', {
          speed: { min: 50, max: 150 },    // Particle velocity range
          scale: { start: 0.3, end: 0 },   // Particle size animation
          lifespan: 300,                   // How long particles last
          quantity: 8,                     // Number of particles
          tint: 0xff0000                   // Red tint for explosion effect
      });
      
      // Clean up explosion particles after animation
      this.scene.time.delayedCall(300, () => {
          particles.destroy();    // Remove particle system
      });
  }
}