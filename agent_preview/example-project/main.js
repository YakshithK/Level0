// main.js
import GameScene from './js/scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    parent: 'game-container'
};

const game = new Phaser.Game(config);