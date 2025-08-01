class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.speed = 100;
        this.setVelocityY(this.speed);
    }
    
    update() {
        if (this.y > 650) {
            this.destroy();
        }
    }
}