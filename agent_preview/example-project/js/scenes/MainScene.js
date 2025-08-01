import Player from '../sprites/Player.js';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('player', 'assets/player.png');
    }

    create() {
        this.player = new Player(this, 100, 450, 'player');
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        this.player.update(this.cursors);
    }
}

export default MainScene;