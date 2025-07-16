// ===========================================
// PLAYER CLASS
// ===========================================
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
      super(scene, x, y, 'player');
      
      this.scene = scene;
      this.health = 100;
      this.maxHealth = 100;
      this.speed = 200;
      this.shootCooldown = 0;
      this.shootRate = 200; // milliseconds
      
      scene.add.existing(this);
      scene.physics.add.existing(this);
      
      this.setCollideWorldBounds(true);
      this.setDrag(400);
      
      // Input
      this.keys = scene.input.keyboard.createCursorKeys();
      this.wasd = scene.input.keyboard.addKeys('W,S,A,D');
  }
  
  update(time, delta) {
      this.handleMovement();
      this.handleRotation();
      this.handleShooting(time);
  }
  
  handleMovement() {
      const speed = this.speed;
      let velX = 0;
      let velY = 0;
      
      if (this.wasd.A.isDown) velX = -speed;
      if (this.wasd.D.isDown) velX = speed;
      if (this.wasd.W.isDown) velY = -speed;
      if (this.wasd.S.isDown) velY = speed;
      
      this.setVelocity(velX, velY);
  }
  
  handleRotation() {
      const pointer = this.scene.input.activePointer;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
      this.setRotation(angle);
  }
  
  handleShooting(time) {
      if (this.scene.input.activePointer.isDown && time > this.shootCooldown) {
          this.shoot();
          this.shootCooldown = time + this.shootRate;
      }
  }
  
  shoot() {
      const bullet = new Bullet(this.scene, this.x, this.y, this.rotation);
      this.scene.bullets.add(bullet);
      
      // Add bullet to physics world immediately
      this.scene.physics.world.enable(bullet);
      
      // Set velocity after enabling physics
      const vel = this.scene.physics.velocityFromRotation(this.rotation, 400);
      bullet.setVelocity(vel.x, vel.y);
  }
  
  takeDamage(amount) {
      this.health -= amount;
      this.scene.cameras.main.shake(100, 0.02);
      
      if (this.health <= 0) {
          this.scene.gameOver();
      }
  }
}