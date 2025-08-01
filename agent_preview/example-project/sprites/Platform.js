class Platform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, width, height, color) {
        // Create graphics for platform
        const graphics = scene.add.graphics();
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, width, height);
        graphics.generateTexture('platform' + x + y, width, height);
        graphics.destroy();
        
        super(scene, x, y, 'platform' + x + y);
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        
        this.setOrigin(0.5, 0.5);
        this.setSize(width, height);
    }
}