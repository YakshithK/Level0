class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, direction = 1) {
        super(scene, x, y, 'bullet');
        
        this.scene = scene;
        this.direction = direction; // 1 for right, -1 for left
        this.speed = 400;
        this.lifespan = 2000; // milliseconds
        this.damage = 10;
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Set physics properties
        this.setCollideWorldBounds(true);
        this.setBounce(0);
        this.setImmovable(true);
        
        // Set initial velocity
        this.setVelocityX(this.speed * this.direction);
        
        // Set lifespan timer
        this.lifespanTimer = this.scene.time.delayedCall(this.lifespan, () => {
            this.destroy();
        });
        
        // Set up world bounds collision
        this.body.onWorldBounds = true;
        this.body.world.on('worldbounds', (body) => {
            if (body.gameObject === this) {
                this.destroy();
            }
        });
    }
    
    // Method to update bullet position and check lifespan
    update() {
        // Bullet automatically moves due to velocity set in constructor
        // No manual position update needed when using physics velocity
        
        // Check if bullet is out of bounds (additional safety check)
        if (this.x < -50 || this.x > this.scene.game.config.width + 50) {
            this.destroy();
        }
    }
    
    // Method to handle collision with targets
    onHit(target) {
        if (target && target.takeDamage) {
            target.takeDamage(this.damage);
        }
        
        // Create a small explosion effect
        this.createImpactEffect();
        
        // Destroy the bullet
        this.destroy();
    }
    
    // Method to create impact visual effect
    createImpactEffect() {
        // Using add.circle which is available in Phaser 3.60+
        const impact = this.scene.add.circle(this.x, this.y, 5, 0xffff00);
        
        this.scene.tweens.add({
            targets: impact,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                impact.destroy();
            }
        });
    }
    
    // Method to destroy the bullet and clean up
    destroy() {
        if (this.lifespanTimer) {
            this.lifespanTimer.destroy();
        }
        
        super.destroy();
    }
    
    // Static method to create a bullet
    static create(scene, x, y, direction) {
        return new Bullet(scene, x, y, direction);
    }
}