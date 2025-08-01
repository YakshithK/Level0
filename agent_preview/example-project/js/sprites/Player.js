// Player.js
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.speed = 300;
    }
    
    update(keys) {
        this.setVelocity(0);
        if (keys.A.isDown) this.setVelocityX(-this.speed);
        if (keys.D.isDown) this.setVelocityX(this.speed);
        if (keys.W.isDown) this.setVelocityY(-this.speed);
        if (keys.S.isDown) this.setVelocityY(this.speed);
    }
}

export default Player;