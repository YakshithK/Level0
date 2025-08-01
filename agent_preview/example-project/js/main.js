import MainScene from './scenes/MainScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: MainScene,
    parent: 'game-container'
};

const game = new Phaser.Game(config);