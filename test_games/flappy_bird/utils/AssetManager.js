// utils/AssetManager.js
class AssetManager {
    static generateAssets(scene) {
        // Bird
        scene.add.graphics()
            .fillStyle(COLORS.BIRD)
            .fillCircle(17, 12, 12)
            .generateTexture('bird', 34, 24);
        
        // Pipe
        scene.add.graphics()
            .fillStyle(COLORS.PIPE)
            .fillRect(0, 0, 52, 320)
            .generateTexture('pipe', 52, 320);
        
        // Ground
        scene.add.graphics()
            .fillStyle(COLORS.GROUND)
            .fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.GROUND_HEIGHT)
            .generateTexture('ground', GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.GROUND_HEIGHT);
    }
} 