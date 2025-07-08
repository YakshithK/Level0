// utils/GameState.js
class GameState {
    constructor() {
        this.score = 0;
        this.highScore = 0;
        this.gameStarted = false;
        this.gameOver = false;
    }

    reset() {
        this.score = 0;
        this.gameStarted = false;
        this.gameOver = false;
    }

    addScore() {
        this.score++;
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
    }

    setGameOver() {
        this.gameOver = true;
    }

    startGame() {
        this.gameStarted = true;
    }
}

// Create global game state
const gameState = new GameState(); 