/**
 * Player sprite class with movement and shooting capabilities
 */
class PlayerSprite extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        const textureKey = CONSTANTS ? CONSTANTS.ASSETS.PLAYER : 'player';
        super(scene, x, y, textureKey);
        
        this.scene = scene;
        this.health = 100;
        this.speed = 300;
        this.lastFired = 0;
        this.fireRate = 200; // milliseconds
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics
        this.setCollideWorldBounds(true);
        this.setScale(2);
        this.setTint(0x00ff00);
        
        // Create bullet group
        this.bullets = scene.bullets || null;
        
        // Set up input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
    
    /**
     * Update player state
     * @param {number} time - Current game time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
        this.handleMovement();
        this.handleShooting(time);
    }
    
    /**
     * Handle player movement based on input
     */
    handleMovement() {
        const velocity = { x: 0, y: 0 };
        
        if (this.cursors.left.isDown) {
            velocity.x = -this.speed;
        } else if (this.cursors.right.isDown) {
            velocity.x = this.speed;
        }
        
        if (this.cursors.up.isDown) {
            velocity.y = -this.speed;
        } else if (this.cursors.down.isDown) {
            velocity.y = this.speed;
        }
        
        this.setVelocity(velocity.x, velocity.y);
    }
    
    /**
     * Handle shooting based on input and fire rate
     * @param {number} time - Current game time
     */
    handleShooting(time) {
        if (this.spaceKey.isDown && time > this.lastFired + this.fireRate) {
            this.fireBullet();
            this.lastFired = time;
        }
    }
    
    /**
     * Fire a bullet from the player's position
     */
    fireBullet() {
        if (!this.bullets) {
            console.warn('Bullet group not available');
            return;
        }
        
        const bullet = this.bullets.get();
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.x = this.x;
            bullet.y = this.y - 20;
            bullet.setVelocity(0, -500);
            bullet.setTint(0xffff00);
        }
    }
    
    /**
     * Get the bullet group for collision detection
     * @returns {Phaser.Physics.Arcade.Group} The bullet group
     */
    getBulletGroup() {
        return this.bullets;
    }
    
    /**
     * Handle player taking damage
     * @param {number} amount - Amount of damage to take
     */
    takeDamage(amount) {
        this.health -= amount;
        
        // Flash red when hit
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.setTint(0x00ff00);
        });
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * Handle player death
     */
    die() {
        this.setActive(false);
        this.setVisible(false);
        this.scene.events.emit('gameOver');
    }
}