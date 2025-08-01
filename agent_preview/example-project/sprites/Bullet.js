class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setVelocityY(-400);
    }
    
    update() {
        if (this.y < -50) {
            this.destroy();
        }
    }
}