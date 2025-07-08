// scenes/BootScene.js
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const loadingBar = this.add.graphics();
        const loadingBox = this.add.graphics();
        
        loadingBox.fillStyle(0x222222);
        loadingBox.fillRect(240, 270, 320, 50);
        
        this.load.on('progress', (value) => {
            loadingBar.clear();
            loadingBar.fillStyle(COLORS.BIRD);
            loadingBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('complete', () => {
            loadingBar.destroy();
            loadingBox.destroy();
        });

        // Generate assets
        AssetManager.generateAssets(this);
    }

    create() {
        this.scene.start('MenuScene');
    }
} 