class SnakeGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SnakeGameScene' });
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.moveTimer = 0;
        this.moveDelay = gameOptions.initialSpeed;
    }

    preload() {
        // Create simple colored rectangles for snake and food
        this.load.image('snake-body', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        this.load.image('food', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        // Set a distinct background color to ensure sprites are visible
        this.cameras.main.setBackgroundColor('#1a1a2e');
        
        // Initialize snake
        this.initializeSnake();
        
        // Create food
        this.createFood();
        
        // Set up WASD controls
        this.setupControls();
        
        // Display score
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        // Display instructions
        this.add.text(16, 550, 'Use WASD to move', {
            fontSize: '16px',
            fill: '#ffffff'
        });
    }

    initializeSnake() {
        this.snake = [];
        const startX = Math.floor(gameOptions.gridSize / 2);
        const startY = Math.floor(gameOptions.gridSize / 2);
        
        // Create initial snake body (3 segments)
        for (let i = 0; i < 3; i++) {
            const segment = this.add.rectangle(
                (startX - i) * gameOptions.tileSize + gameOptions.tileSize / 2,
                startY * gameOptions.tileSize + gameOptions.tileSize / 2,
                gameOptions.tileSize - 2,
                gameOptions.tileSize - 2,
                0x00ff00
            );
            this.snake.push(segment);
        }
    }

    createFood() {
        let foodX, foodY;
        let validPosition = false;
        
        // Find a valid position for food (not on snake)
        while (!validPosition) {
            foodX = Math.floor(Math.random() * gameOptions.gridSize);
            foodY = Math.floor(Math.random() * gameOptions.gridSize);
            
            validPosition = true;
            for (let segment of this.snake) {
                const segmentX = Math.floor(segment.x / gameOptions.tileSize);
                const segmentY = Math.floor(segment.y / gameOptions.tileSize);
                if (segmentX === foodX && segmentY === foodY) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        if (this.food) {
            this.food.destroy();
        }
        
        this.food = this.add.rectangle(
            foodX * gameOptions.tileSize + gameOptions.tileSize / 2,
            foodY * gameOptions.tileSize + gameOptions.tileSize / 2,
            gameOptions.tileSize - 2,
            gameOptions.tileSize - 2,
            0xff0000
        );
    }

    setupControls() {
        // Create WASD key objects
        this.wasd = this.input.keyboard.addKeys('W,S,A,D');
        
        // Prevent default browser behavior for these keys
        this.input.keyboard.addCapture(['W', 'S', 'A', 'D']);
        
        // Handle key press events
        this.wasd.W.on('down', () => {
            if (this.direction !== 'down') {
                this.nextDirection = 'up';
            }
        });
        
        this.wasd.S.on('down', () => {
            if (this.direction !== 'up') {
                this.nextDirection = 'down';
            }
        });
        
        this.wasd.A.on('down', () => {
            if (this.direction !== 'right') {
                this.nextDirection = 'left';
            }
        });
        
        this.wasd.D.on('down', () => {
            if (this.direction !== 'left') {
                this.nextDirection = 'right';
            }
        });
    }

    update(time, delta) {
        // Update movement timer
        this.moveTimer += delta;
        
        if (this.moveTimer >= this.moveDelay) {
            this.moveTimer = 0;
            this.moveSnake();
        }
    }

    moveSnake() {
        // Update direction
        this.direction = this.nextDirection;
        
        // Get head position
        const head = this.snake[0];
        let newX = head.x;
        let newY = head.y;
        
        // Calculate new head position based on direction
        switch (this.direction) {
            case 'up':
                newY -= gameOptions.tileSize;
                break;
            case 'down':
                newY += gameOptions.tileSize;
                break;
            case 'left':
                newX -= gameOptions.tileSize;
                break;
            case 'right':
                newX += gameOptions.tileSize;
                break;
        }
        
        // Check wall collision
        if (newX < 0 || newX >= gameOptions.gridSize * gameOptions.tileSize ||
            newY < 0 || newY >= gameOptions.gridSize * gameOptions.tileSize) {
            this.gameOver();
            return;
        }
        
        // Check self collision
        for (let segment of this.snake) {
            if (Math.abs(segment.x - newX) < 1 && Math.abs(segment.y - newY) < 1) {
                this.gameOver();
                return;
            }
        }
        
        // Create new head
        const newHead = this.add.rectangle(
            newX,
            newY,
            gameOptions.tileSize - 2,
            gameOptions.tileSize - 2,
            0x00ff00
        );
        
        // Add new head to snake
        this.snake.unshift(newHead);
        
        // Check food collision
        if (Math.abs(newX - this.food.x) < 1 && Math.abs(newY - this.food.y) < 1) {
            // Eat food
            this.score += 10;
            this.scoreText.setText('Score: ' + this.score);
            this.createFood();
            
            // Increase speed slightly
            this.moveDelay = Math.max(50, this.moveDelay - gameOptions.speedIncrease);
        } else {
            // Remove tail
            const tail = this.snake.pop();
            tail.destroy();
        }
    }

    gameOver() {
        this.add.text(400, 300, 'Game Over!', {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.add.text(400, 350, 'Press R to Restart', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Add restart key
        this.input.keyboard.on('keydown-R', () => {
            this.scene.restart();
        });
        
        // Disable movement
        this.moveDelay = Infinity;
    }
}