class Snake {
  constructor(scene, x, y, size) {
    this.scene = scene;
    this.size = size;
    this.direction = new Phaser.Math.Vector2(1, 0);
    this.speed = 150;
    this.lastMoveTime = 0;
    
    this.body = [];
    this.body.push(new Phaser.Math.Vector2(x, y));
    this.body.push(new Phaser.Math.Vector2(x - size, y));
    this.body.push(new Phaser.Math.Vector2(x - size * 2, y));
    
    this.graphics = scene.add.graphics();
    this.draw();
  }
  
  draw() {
    this.graphics.clear();
    this.graphics.fillStyle(0x00ff00);
    
    for (let i = 0; i < this.body.length; i++) {
      const segment = this.body[i];
      this.graphics.fillRect(segment.x, segment.y, this.size, this.size);
    }
  }
  
  update(time) {
    if (time >= this.lastMoveTime + this.speed) {
      this.move();
      this.lastMoveTime = time;
    }
  }
  
  move() {
    const head = this.body[0];
    const newHead = new Phaser.Math.Vector2(
      head.x + this.direction.x * this.size,
      head.y + this.direction.y * this.size
    );
    
    this.body.unshift(newHead);
    this.body.pop();
    
    this.draw();
  }
  
  changeDirection(newDirection) {
    if (this.direction.x !== -newDirection.x || this.direction.y !== -newDirection.y) {
      this.direction = newDirection;
    }
  }
  
  grow() {
    const tail = this.body[this.body.length - 1];
    this.body.push(new Phaser.Math.Vector2(tail.x, tail.y));
  }
  
  checkCollision(width, height) {
    const head = this.body[0];
    
    // Check boundaries
    if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
      return true;
    }
    
    // Check self collision
    for (let i = 1; i < this.body.length; i++) {
      const segment = this.body[i];
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }
    
    return false;
  }
  
  getHead() {
    return this.body[0];
  }
}