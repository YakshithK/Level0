/**
 * Enemy sprite class with basic AI and movement
 */
class EnemySprite extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const textureKey = CONSTANTS ? CONSTANTS.ASSETS.ENEMY : 'enemy';
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.health = CONSTANTS ? CONSTANTS.ENEMY_HEALTH : 50;
        this.speed = 100;
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics
        this.setScale(1.5);
        this.setTint(0xff0000);
        
        // Movement pattern
        this.direction = 1;
        this.changeDirectionTimer = 0;
    }
    
    /**
     * Update enemy state
     * @param {number} time - Current game time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        this.handleMovement(time, delta);
    }
    
    /**
     * Handle enemy movement
     * @param {number} time - Current game time
     * @param {number} delta - Time since last update
     */
    handleMovement(time, delta) {
        // Simple downward movement with slight horizontal drift
        this.setVelocity(0, this.speed);
        
        // Change direction occasionally
        if (time > this.changeDirectionTimer) {
            this.direction = Math.random() > 0.5 ? 1 : -1;
            this.changeDirectionTimer = time + Phaser.Math.Between(1000, 3000);
        }
        
        this.setVelocityX(this.direction * 50);
        
        // Destroy if off screen
        const gameHeight = CONSTANTS ? CONSTANTS.GAME_HEIGHT : 600;
        if (this.y > gameHeight + 50) {
            this.destroy();
        }
    }
    
    /**
     * Handle enemy taking damage
     * @param {number} amount - Amount of damage to take
     */
    takeDamage(amount) {
        this.health -= amount;
        
        // Flash white when hit
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => {
            this.setTint(0xff0000);
        });
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * Handle enemy death
     */
    die() {
        // Create explosion effect
        const explosion = this.scene.add.circle(this.x, this.y, 20, 0xff6600);
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });
        
        // Emit event
        this.scene.events.emit('enemyKilled', this);
        
        // Deactivate and hide
        this.setActive(false);
        this.setVisible(false);
    }
}