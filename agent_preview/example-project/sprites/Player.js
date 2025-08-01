class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null);
        
        // Create a simple rectangle as player
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x00ff00);
        graphics.fillRect(-16, -16, 32, 32);
        graphics.generateTexture('player', 32, 32);
        graphics.destroy();
        
        this.setTexture('player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.speed = 200;
        
        // Create cursor keys
        this.cursors = scene.input.keyboard.createCursorKeys();
    }
    
    update() {
        // Reset velocity
        this.setVelocity(0);
        
        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.setVelocityX(-this.speed);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(this.speed);
        }
        
        // Vertical movement
        if (this.cursors.up.isDown) {
            this.setVelocityY(-this.speed);
        } else if (this.cursors.down.isDown) {
            this.setVelocityY(this.speed);
        }
    }
}