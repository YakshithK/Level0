// GameScene.js
import Player from '../sprites/Player.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    preload() {
        this.load.image('player', 'assets/player.png');
    }
    
    create() {
        this.player = new Player(this, 400, 300);
        this.keys = this.input.keyboard.addKeys('W,S,A,D');
    }
    
    update() {
        this.player.update(this.keys);
    }
}

export default GameScene;