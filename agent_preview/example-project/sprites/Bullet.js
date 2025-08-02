// ===========================================
// BULLET CLASS - Projectile/Shot System
// ===========================================
// This class handles all shooting mechanics, projectiles, and bullet behavior
// Manages bullet movement, damage, trajectory, and collision detection
// Controls shot speed, bullet physics, and projectile lifecycle
class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, rotation) {
      super(scene, x, y, 'bullet');
      
      this.scene = scene;
      this.speed = 400;        // Shot velocity and projectile speed
      this.damage = 25;        // Bullet damage per shot hit
      
      this.setRotation(rotation);
      
      // Add to scene and enable physics for shooting mechanics
      scene.add.existing(this);
      scene.physics.add.existing(this);
      
      // Set velocity for bullet trajectory and shot direction
      const vel = scene.physics.velocityFromRotation(rotation, this.speed);
      this.setVelocity(vel.x, vel.y);
  }
  
  update() {
      // Destroy bullet if it goes off-screen - cleanup shot projectiles
      // Remove bullets that have traveled beyond game boundaries
      if (this.x < -50 || this.x > this.scene.sys.game.config.width + 50 ||
          this.y < -50 || this.y > this.scene.sys.game.config.height + 50) {
          this.destroy();
      }
  }
}