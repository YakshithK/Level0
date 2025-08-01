/**
 * Projectile sprite class for player bullets
 */
class ProjectileSprite extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'projectile');
        
        this.scene = scene;
        
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Physics setup
        this.body.setVelocityY(-PLAYER_CONFIG.BULLET_SPEED);
        this.body.setSize(PROJECTILE_CONFIG.WIDTH, PROJECTILE_CONFIG.HEIGHT);
        
        // Create graphics
        this.createProjectileGraphics();
        
        // Auto-cleanup when out of bounds
        this.body.setCollideWorldBounds(false);
        this.body.onWorldBounds = true;
        this.scene.physics.world.on('worldbounds', this.onWorldBounds, this);
    }
    
    /**
     * Create projectile graphics using Phaser's graphics API
     */
    createProjectileGraphics() {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(PROJECTILE_CONFIG.COLOR);
        graphics.fillRect(0, 0, PROJECTILE_CONFIG.WIDTH, PROJECTILE_CONFIG.HEIGHT);
        
        // Generate texture from graphics
        graphics.generateTexture('projectile', PROJECTILE_CONFIG.WIDTH, PROJECTILE_CONFIG.HEIGHT);
        graphics.destroy();
    }
    
    /**
     * Handle world bounds collision
     * @param {Phaser.Physics.Arcade.Body} body - The physics body
     */
    onWorldBounds(body) {
        if (body.gameObject === this) {
            this.destroy();
        }
    }
    
    /**
     * Clean up when destroyed
     */
    destroy() {
        if (this.scene.physics && this.scene.physics.world) {
            this.scene.physics.world.off('worldbounds', this.onWorldBounds, this);
        }
        super.destroy();
    }
}