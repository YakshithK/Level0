// objects/Bird.js
class Bird extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bird');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setBounce(0.2);
        this.setCollideWorldBounds(true);
        this.body.setSize(30, 20);
        
        this.initialX = x;
        this.initialY = y;
    }

    flap() {
        this.setVelocityY(GAME_CONFIG.BIRD_JUMP_VELOCITY);
        
        // Add bounce effect
        this.scene.tweens.add({
            targets: this,
            scaleY: 1.1,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }

    update() {
        // Rotate bird based on velocity
        if (this.body.velocity.y < 0) {
            this.angle = -20;
        } else if (this.body.velocity.y > 0) {
            this.angle = 20;
        }
    }

    reset() {
        this.setPosition(this.initialX, this.initialY);
        this.setVelocity(0, 0);
        this.angle = 0;
    }
} 