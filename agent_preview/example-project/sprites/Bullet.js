// ===========================================
// BULLET CLASS
// ===========================================
class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, rotation) {
      super(scene, x, y, 'bullet');
      
      this.scene = scene;
      this.speed = 400;
      this.damage = 25;
      
      this.setRotation(rotation);
      
      // Add to scene and enable physics
      scene.add.existing(this);
      scene.physics.add.existing(this);
      
      // Set velocity
      const vel = scene.physics.velocityFromRotation(rotation, this.speed);
      this.setVelocity(vel.x, vel.y);
  }
  
  update() {
      // Destroy bullet if it goes off-screen
      if (this.x < -50 || this.x > this.scene.sys.game.config.width + 50 ||
          this.y < -50 || this.y > this.scene.sys.game.config.height + 50) {
          this.destroy();
      }
  }
}