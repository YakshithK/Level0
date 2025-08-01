/**
 * Bullet sprite class for projectiles
 */
class BulletSprite extends Phaser.Physics.Arcade.Sprite {
    /**
     * Create a new bullet
     * @param {Phaser.Scene} scene - The scene this bullet belongs to
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     */
    constructor(scene, x, y) {
        const textureKey = CONSTANTS ? CONSTANTS.ASSETS.BULLET : 'bullet';
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.damage = CONSTANTS ? CONSTANTS.BULLET_DAMAGE : 25;
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics
        this.setCollideWorldBounds(false);
        
        // Set bullet properties
        this.setScale(0.5);
        this.setDepth(10);
        
        // Auto-cleanup when out of bounds
        this.lifespan = 3000; // 3 seconds
        this.birthTime = scene.time.now;
    }
    
    /**
     * Update bullet state
     * @param {number} time - Current game time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        // Check if bullet should be destroyed
        if (time - this.birthTime > this.lifespan) {
            this.destroy();
            return;
        }
        
        // Destroy if out of screen bounds (with buffer)
        const buffer = 50;
        const gameWidth = CONSTANTS ? CONSTANTS.GAME_WIDTH : 800;
        const gameHeight = CONSTANTS ? CONSTANTS.GAME_HEIGHT : 600;
        if (this.x < -buffer || this.x > gameWidth + buffer ||
            this.y < -buffer || this.y > gameHeight + buffer) {
            this.destroy();
        }
    }
    
    /**
     * Handle collision with target
     * @param {Phaser.GameObjects.GameObject} target - The object hit by this bullet
     */
    onHit(target) {
        // Deal damage if target has health
        if (target && typeof target.takeDamage === 'function') {
            target.takeDamage(this.damage);
        }
        
        // Create impact effect
        this.createImpactEffect();
        
        // Destroy bullet
        this.destroy();
    }
    
    /**
     * Create visual effect when bullet hits something
     */
    createImpactEffect() {
        // Simple flash effect
        const flash = this.scene.add.circle(this.x, this.y, 8, 0xffff00);
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }
}