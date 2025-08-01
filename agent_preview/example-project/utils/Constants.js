/**
 * Game-wide constants and configuration values
 */
const CONSTANTS = {
    // Game settings
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    
    // Player settings
    PLAYER_SPEED: 300,
    PLAYER_HEALTH: 100,
    
    // Bullet settings
    BULLET_SPEED: 600,
    BULLET_DAMAGE: 25,
    BULLET_COOLDOWN: 200, // milliseconds
    
    // Enemy settings
    ENEMY_SPEED: 100,
    ENEMY_HEALTH: 50,
    ENEMY_SPAWN_RATE: 2000, // milliseconds
    
    // Physics groups
    GROUPS: {
        PLAYER_BULLETS: 'playerBullets',
        ENEMIES: 'enemies',
        ENEMY_BULLETS: 'enemyBullets'
    },
    
    // Asset keys
    ASSETS: {
        PLAYER: 'player',
        ENEMY: 'enemy',
        BULLET: 'bullet',
        EXPLOSION: 'explosion'
    },
    
    // Fonts
    FONTS: {
        MAIN: 'Arial'
    }
};

// Freeze constants to prevent modification
Object.freeze(CONSTANTS);