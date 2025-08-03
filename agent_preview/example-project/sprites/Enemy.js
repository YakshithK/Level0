// ===========================================
// ENEMY CLASS
// ===========================================
class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
      super(scene, x, y, 'enemy');
      
      this.scene = scene;
      this.health = 50;
      this.speed = 80;
      this.damage = 20;
      this.lastAttack = 0;
      this.attackRate = 1000; // milliseconds
      
      scene.add.existing(this);
      scene.physics.add.existing(this);
      
      this.setCollideWorldBounds(true);
      this.setBounce(0.2);
  }
  
  update(time) {
      this.chasePlayer();
  }
  
  chasePlayer() {
      const player = this.scene.player;
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      
      if (distance > 20) {
          this.scene.physics.moveToObject(this, player, this.speed);
      } else {
          this.setVelocity(0, 0);
      }
  }
  
  takeDamage(amount) {
      this.health -= amount;
      
      // Flash effect
      this.setTint(0xff6666);
      this.scene.time.delayedCall(100, () => {
          this.clearTint();
      });
      
      if (this.health <= 0) {
          this.die();
      }
  }
  
  die() {
      // Death explosion effect
      this.createExplosion();
      this.scene.score += 10;
      this.destroy();
  }
  
  createExplosion() {
      // Create explosion effect using bullet texture
      const particles = this.scene.add.particles(this.x, this.y, 'bullet', {
          speed: { min: 50, max: 150 },
          scale: { start: 0.3, end: 0 },
          lifespan: 300,
          quantity: 8,
          tint: 0xff0000 // Red tint for explosion
      });
      
      this.scene.time.delayedCall(300, () => {
          particles.destroy();
      });
  }
}