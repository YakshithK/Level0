class Coin extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null);
        
        // Create a simple circle as coin
        const graphics = scene.add.graphics();
        graphics.fillStyle(0xffff00);
        graphics.fillCircle(12, 12, 12);
        graphics.generateTexture('coin', 24, 24);
        graphics.destroy();
        
        this.setTexture('coin');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Add rotation animation
        this.scene.tweens.add({
            targets: this,
            angle: 360,
            duration: 2000,
            repeat: -1
        });
    }
    
    collect() {
        // Create collect effect
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.destroy();
            }
        });
    }
}