class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene")
  }

  create() {
    this.add.text(200, 200, '🐍 Snake Game', {
      font: "32px Arial",
      fill: "#ffffff"
    });

    const playButton = this.add.text(250, 300, "▶️ Play", {
      font: "24px Arial",
      fill: "#00ff00"
    }).setInteractive();

    playButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}

let snake;
let apple;
let direction = "RIGHT";
let nextMove = 0;
let cursors
let score;
let scoreText;

const gridSize = 20;
let moveInterval = 150;

// Add positionsHistory for smooth movement
let positionsHistory = [];

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }
  
  preload() {
    this.load.image('apple', './assets/apple.png');
    this.load.audio('eat', './assets/eat.wav');
    this.load.audio('gameover', './assets/gameover.wav');
    
    // Add error handling
    this.load.on('loaderror', function(file) {
        console.error('Failed to load:', file.src);
    });
    
    this.load.on('complete', function() {
    });
  }

  create() {
    moveInterval = 150;
    nextMove = 0;
    direction = 'RIGHT';
    score = 0;
    cursors = this.input.keyboard.createCursorKeys();
  
    snake = this.add.group();
    snake.head = this.add.rectangle(100, 100, gridSize, gridSize, 0x00ff00);
    snake.add(snake.head);
    snake.body = [];
    
    // Reset positionsHistory
    positionsHistory = [{ x: snake.head.x, y: snake.head.y }];
  
    spawnApple(this);

    score = 0;
    scoreText = this.add.text(10, 10, "Score: 0", {
      font: "20px Arial",
      fill: "#ffffff"
    });
  }
  
  update(time) {
      if (time >= nextMove) {
        moveSnake(this);
        nextMove = time + moveInterval;
      }
    
      handleInput();
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score;
  }

  create() {
    this.add.text(200, 200, '💀 Game Over', {
      font: '32px Arial',
      fill: '#ff0000'
    });

    this.add.text(200, 250, 'Your Score: ' + this.finalScore, {
      font: '24px Arial',
      fill: '#ffffff'
    });

    const restartButton = this.add.text(230, 320, '🔁 Play Again', {
      font: '24px Arial',
      fill: '#00ff00'
    }).setInteractive();

    restartButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    const menuButton = this.add.text(260, 370, '🏠 Menu', {
      font: '20px Arial',
      fill: '#ffffff'
    }).setInteractive();

    menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}

function handleInput() {
  if (cursors.left.isDown && direction !== 'RIGHT') direction = 'LEFT';
  else if (cursors.right.isDown && direction !== 'LEFT') direction = 'RIGHT';
  else if (cursors.up.isDown && direction !== 'DOWN') direction = 'UP';
  else if (cursors.down.isDown && direction !== 'UP') direction = 'DOWN';
}

function moveSnake(scene) {
  const head = snake.head;
  const x = head.x;
  const y = head.y;

  let newX = x, newY = y;
  if (direction === 'LEFT') newX -= gridSize;
  else if (direction === 'RIGHT') newX += gridSize;
  else if (direction === 'UP') newY -= gridSize;
  else if (direction === 'DOWN') newY += gridSize;

  console.log(`Snake head target position: (${Math.round(newX)}, ${Math.round(newY)})`);
  console.log(`Apple position: (${Math.round(apple.x)}, ${Math.round(apple.y)})`);

  // check wall collision
  if (newX < 0 || newX >= config.width || newY < 0 || newY >= config.height) {
    scene.sound.play('gameover');
    scene.time.delayedCall(400, () => {
      scene.scene.start('GameOverScene', { score });
    });
    return;
  }

  // Store the target head position at the front of the history
  positionsHistory.unshift({ x: newX, y: newY });

  // Move head smoothly
  scene.tweens.add({
    targets: head,
    x: newX,
    y: newY,
    duration: moveInterval,
    ease: 'Linear'
  });

  // Move body segments smoothly to the previous position of the segment ahead
  for (let i = 0; i < snake.body.length; i++) {
    const pos = positionsHistory[i + 1];
    if (pos) {
      scene.tweens.add({
        targets: snake.body[i],
        x: pos.x,
        y: pos.y,
        duration: moveInterval,
        ease: 'Linear'
      });
    }
  }

  // Trim positionsHistory to head + body length
  positionsHistory = positionsHistory.slice(0, snake.body.length + 1);
  
  // check apple collision
  if (Math.abs(newX - apple.x) < 10 && Math.abs(newY - apple.y) < 10) {
    console.log("Apple eaten at", apple.x, apple.y);
    // Place new body part at the last position in the history (tail's last position)
    const tailPos = positionsHistory[positionsHistory.length - 1] || { x: x, y: y };
    const newPart = scene.add.rectangle(tailPos.x, tailPos.y, gridSize, gridSize, 0x00aa00);
    snake.body.push(newPart);
    scene.sound.play('eat');
    snake.add(newPart);
    spawnApple(scene);

    score += 1;
    scoreText.setText("Score: " + score);

    if (moveInterval > 50) {
      moveInterval -= 5;
    }
    // Add a new position for the new body part at the end of the history
    positionsHistory.push({ x: tailPos.x, y: tailPos.y });
  }

  // check self collision
  for (let i = 1; i < snake.body.length; i++) {
    if (head.x === snake.body[i].x && head.y === snake.body[i].y) {
      scene.scene.start('GameOverScene', { score });
      return;
    }
  }
}

function spawnApple(scene) {
  if (apple) apple.destroy();

  const maxX = config.width / gridSize;
  const maxY = config.height / gridSize;
  const x = Phaser.Math.Between(0, maxX - 1) * gridSize;
  const y = Phaser.Math.Between(0, maxY - 1) * gridSize;

  apple = scene.add.image(x, y, 'apple');

  apple.x = Math.round(apple.x);
  apple.y = Math.round(apple.y);

  apple.setDisplaySize(gridSize, gridSize);
}

// Move Phaser config and game initialization here
const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 600,
  backgroundColor: '#1d1d1d',
  pixelArt: true,
  scene: [MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);