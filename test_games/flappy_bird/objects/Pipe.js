// Pipe Class - Handles pipe behavior and spawning
class Pipe extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, isTop = false) {
        super(scene, x, y, 'pipe');
        
        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Pipe properties
        this.isTop = isTop;
        this.speed = 200;
        this.passed = false;
        
        // Set up physics
        this.body.setImmovable(true);
        
        // Rotate top pipe
        if (isTop) {
            this.setAngle(180);
        }
        
        // Set velocity
        this.setVelocityX(-this.speed);
    }

    update() {
        // Mark as passed when bird goes through
        if (!this.passed && this.x < 150) {
            this.passed = true;
            this.scene.events.emit('pipePassed');
        }
        
        // Destroy when off screen
        if (this.x < -100) {
            this.destroy();
        }
    }

    setSpeed(speed) {
        this.speed = speed;
        this.setVelocityX(-this.speed);
    }
}

// Pipe Pair Class - Manages top and bottom pipes together
class PipePair {
    constructor(scene, x, y, gap = 150) {
        this.scene = scene;
        this.gap = gap;
        this.passed = false;
        
        // Create top and bottom pipes
        this.topPipe = new Pipe(scene, x, y - gap/2, true);
        this.bottomPipe = new Pipe(scene, x, y + gap/2, false);
        
        // Add to pipe group if scene has one
        if (scene.pipeGroup) {
            scene.pipeGroup.add(this.topPipe);
            scene.pipeGroup.add(this.bottomPipe);
        }
    }

    update() {
        this.topPipe.update();
        this.bottomPipe.update();
        
        // Check if bird passed through
        if (!this.passed && this.topPipe.x < 150) {
            this.passed = true;
            this.scene.events.emit('pipePairPassed');
        }
    }

    setSpeed(speed) {
        this.topPipe.setSpeed(speed);
        this.bottomPipe.setSpeed(speed);
    }

    destroy() {
        this.topPipe.destroy();
        this.bottomPipe.destroy();
    }

    getBounds() {
        return {
            top: this.topPipe.getBounds(),
            bottom: this.bottomPipe.getBounds()
        };
    }
}

// Pipe Manager Class - Handles pipe spawning and management
class PipeManager {
    constructor(scene) {
        this.scene = scene;
        this.pipePairs = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500; // 1.5 seconds
        this.baseGap = 150;
        this.minGap = 120;
        this.maxGap = 200;
        this.speedIncrease = 10;
        this.currentSpeed = 200;
        this.maxSpeed = 400;
    }

    update(time, delta) {
        // Update spawn timer
        this.spawnTimer += delta;
        
        // Spawn new pipe pair
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnPipePair();
            this.spawnTimer = 0;
        }
        
        // Update existing pipes
        this.pipePairs.forEach(pair => pair.update());
        
        // Clean up destroyed pipes
        this.pipePairs = this.pipePairs.filter(pair => 
            pair.topPipe.active && pair.bottomPipe.active
        );
    }

    spawnPipePair() {
        const x = 800;
        const y = Phaser.Math.Between(200, 400);
        const gap = Phaser.Math.Between(this.minGap, this.maxGap);
        
        const pipePair = new PipePair(this.scene, x, y, gap);
        pipePair.setSpeed(this.currentSpeed);
        
        this.pipePairs.push(pipePair);
        
        // Increase speed gradually
        if (this.currentSpeed < this.maxSpeed) {
            this.currentSpeed += this.speedIncrease * 0.1;
        }
    }

    reset() {
        // Destroy all pipes
        this.pipePairs.forEach(pair => pair.destroy());
        this.pipePairs = [];
        
        // Reset properties
        this.spawnTimer = 0;
        this.currentSpeed = 200;
    }

    pause() {
        this.pipePairs.forEach(pair => {
            pair.topPipe.setVelocityX(0);
            pair.bottomPipe.setVelocityX(0);
        });
    }

    resume() {
        this.pipePairs.forEach(pair => {
            pair.setSpeed(this.currentSpeed);
        });
    }
} 