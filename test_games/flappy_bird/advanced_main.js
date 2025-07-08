// Advanced Flappy Bird Game with Power-ups, Particles, and Enhanced Features

class AdvancedFlappyBirdGame {
    constructor() {
        this.config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            backgroundColor: '#87CEEB',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 800 },
                    debug: false
                }
            },
            scene: [AdvancedBootScene, AdvancedMenuScene, AdvancedGameScene, AdvancedGameOverScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            input: {
                touch: true,
                keyboard: true
            }
        };
        
        this.game = new Phaser.Game(this.config);
    }
}

// Advanced Boot Scene with better asset management
class AdvancedBootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AdvancedBootScene' });
    }

    preload() {
        // Create loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        // Update progress bar
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        this.createAdvancedGraphics();
    }

    create() {
        this.scene.start('AdvancedMenuScene');
    }

    createAdvancedGraphics() {
        // Bird with multiple frames for animation
        const birdGraphics = this.add.graphics();
        birdGraphics.fillStyle(0xFFFF00);
        birdGraphics.fillCircle(20, 20, 20);
        birdGraphics.lineStyle(2, 0x000000);
        birdGraphics.strokeCircle(20, 20, 20);
        birdGraphics.fillStyle(0x000000);
        birdGraphics.fillCircle(25, 15, 3);
        birdGraphics.generateTexture('bird', 40, 40);

        // Flying bird frame
        const birdFlyGraphics = this.add.graphics();
        birdFlyGraphics.fillStyle(0xFFFF00);
        birdFlyGraphics.fillCircle(20, 20, 20);
        birdFlyGraphics.lineStyle(2, 0x000000);
        birdFlyGraphics.strokeCircle(20, 20, 20);
        birdFlyGraphics.fillStyle(0x000000);
        birdFlyGraphics.fillCircle(25, 15, 3);
        birdFlyGraphics.fillStyle(0xFF0000);
        birdFlyGraphics.fillCircle(15, 25, 2);
        birdFlyGraphics.generateTexture('bird_fly', 40, 40);

        // Enhanced pipe with gradient
        const pipeGraphics = this.add.graphics();
        pipeGraphics.fillGradientStyle(0x00AA00, 0x00AA00, 0x008800, 0x008800, 1);
        pipeGraphics.fillRect(0, 0, 80, 400);
        pipeGraphics.lineStyle(3, 0x006600);
        pipeGraphics.strokeRect(0, 0, 80, 400);
        pipeGraphics.fillStyle(0x00FF00);
        pipeGraphics.fillRect(5, 5, 70, 20);
        pipeGraphics.generateTexture('pipe', 80, 400);

        // Power-up sprite
        const powerUpGraphics = this.add.graphics();
        powerUpGraphics.fillStyle(0xFFD700);
        powerUpGraphics.fillCircle(15, 15, 15);
        powerUpGraphics.lineStyle(2, 0xFFA500);
        powerUpGraphics.strokeCircle(15, 15, 15);
        powerUpGraphics.fillStyle(0xFFA500);
        powerUpGraphics.fillCircle(15, 15, 8);
        powerUpGraphics.generateTexture('powerup', 30, 30);

        // Particle texture
        const particleGraphics = this.add.graphics();
        particleGraphics.fillStyle(0xFFFFFF);
        particleGraphics.fillCircle(5, 5, 5);
        particleGraphics.generateTexture('particle', 10, 10);

        // Background with parallax layers
        const bgGraphics = this.add.graphics();
        bgGraphics.fillStyle(0x87CEEB);
        bgGraphics.fillRect(0, 0, 800, 600);
        bgGraphics.fillStyle(0x98FB98);
        bgGraphics.fillRect(0, 500, 800, 100);
        bgGraphics.generateTexture('background', 800, 600);
    }
}

// Enhanced Menu Scene
class AdvancedMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AdvancedMenuScene' });
    }

    create() {
        // Background
        this.add.image(400, 300, 'background');

        // Title with animation
        const title = this.add.text(400, 150, 'FLAPPY BIRD', {
            fontSize: '48px',
            fill: '#000',
            fontFamily: 'Arial',
            stroke: '#FFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Animate title
        this.tweens.add({
            targets: title,
            y: 170,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });

        // Menu options
        const startButton = this.add.text(400, 300, 'START GAME', {
            fontSize: '24px',
            fill: '#000',
            fontFamily: 'Arial',
            backgroundColor: '#FFF',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        const settingsButton = this.add.text(400, 350, 'SETTINGS', {
            fontSize: '24px',
            fill: '#000',
            fontFamily: 'Arial',
            backgroundColor: '#FFF',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Make buttons interactive
        startButton.setInteractive();
        settingsButton.setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start('AdvancedGameScene');
        });

        startButton.on('pointerover', () => {
            startButton.setScale(1.1);
        });

        startButton.on('pointerout', () => {
            startButton.setScale(1);
        });

        // Particle effect for background
        this.createBackgroundParticles();
    }

    createBackgroundParticles() {
        this.particles = this.add.particles('particle');
        
        this.particles.createEmitter({
            x: { min: 0, max: 800 },
            y: -10,
            speedY: { min: 20, max: 60 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.5, end: 0 },
            lifespan: 4000,
            frequency: 500,
            alpha: { start: 0.5, end: 0 }
        });
    }
}

// Advanced Game Scene with Power-ups and Enhanced Features
class AdvancedGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AdvancedGameScene' });
        this.score = 0;
        this.highScore = 0;
        this.gameOver = false;
        this.powerUpActive = false;
        this.powerUpTimer = 0;
        this.combo = 0;
        this.maxCombo = 0;
    }

    create() {
        // Background
        this.add.image(400, 300, 'background');

        // Initialize managers
        this.initializeManagers();
        
        // Create bird
        this.bird = new AdvancedBird(this, 200, 300);
        
        // Create pipe manager
        this.pipeManager = new AdvancedPipeManager(this);
        
        // Create power-up manager
        this.powerUpManager = new PowerUpManager(this);
        
        // UI
        this.createUI();
        
        // Input
        this.setupInput();
        
        // Events
        this.setupEvents();
        
        // Start spawning
        this.pipeManager.startSpawning();
        this.powerUpManager.startSpawning();
    }

    initializeManagers() {
        this.audioManager = new AudioManager(this);
        this.particleManager = new ParticleManager(this);
        this.scoreManager = new ScoreManager(this);
    }

    createUI() {
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#000',
            fontFamily: 'Arial',
            stroke: '#FFF',
            strokeThickness: 2
        });

        this.comboText = this.add.text(16, 60, 'Combo: 0', {
            fontSize: '24px',
            fill: '#FFD700',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 1
        });

        this.powerUpText = this.add.text(16, 100, '', {
            fontSize: '20px',
            fill: '#FF00FF',
            fontFamily: 'Arial'
        });
    }

    setupInput() {
        this.input.on('pointerdown', this.flap, this);
        this.input.keyboard.on('keydown-SPACE', this.flap, this);
        this.input.keyboard.on('keydown-P', this.togglePause, this);
    }

    setupEvents() {
        this.events.on('pipePassed', this.onPipePassed, this);
        this.events.on('powerUpCollected', this.onPowerUpCollected, this);
        this.events.on('birdDied', this.onBirdDied, this);
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Update managers
        this.pipeManager.update(time, delta);
        this.powerUpManager.update(time, delta);
        this.particleManager.update(time, delta);

        // Update power-up timer
        if (this.powerUpActive) {
            this.powerUpTimer -= delta;
            if (this.powerUpTimer <= 0) {
                this.deactivatePowerUp();
            }
        }

        // Update UI
        this.updateUI();
    }

    flap() {
        if (this.gameOver) return;
        
        if (this.bird.flap()) {
            this.particleManager.createFlapEffect(this.bird.x, this.bird.y);
            this.audioManager.playSound('flap');
        }
    }

    onPipePassed() {
        this.score++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        this.scoreManager.updateScore(this.score);
        this.particleManager.createScoreEffect(400, 100);
        this.audioManager.playSound('score');
        
        // Camera shake for combo
        if (this.combo % 5 === 0) {
            this.cameras.main.shake(200, 0.01);
        }
    }

    onPowerUpCollected() {
        this.activatePowerUp();
        this.particleManager.createPowerUpEffect(this.bird.x, this.bird.y);
        this.audioManager.playSound('powerup');
    }

    activatePowerUp() {
        this.powerUpActive = true;
        this.powerUpTimer = 5000; // 5 seconds
        this.bird.setInvincible(true);
        this.pipeManager.setSpeed(100); // Slow down pipes
    }

    deactivatePowerUp() {
        this.powerUpActive = false;
        this.bird.setInvincible(false);
        this.pipeManager.setSpeed(200); // Normal speed
    }

    onBirdDied() {
        this.gameOver = true;
        this.particleManager.createDeathEffect(this.bird.x, this.bird.y);
        this.audioManager.playSound('hit');
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyHighScore', this.highScore);
        }
        
        this.time.delayedCall(2000, () => {
            this.scene.start('AdvancedGameOverScene', {
                score: this.score,
                highScore: this.highScore,
                maxCombo: this.maxCombo
            });
        });
    }

    updateUI() {
        this.scoreText.setText(`Score: ${this.score}`);
        this.comboText.setText(`Combo: ${this.combo}`);
        
        if (this.powerUpActive) {
            const timeLeft = Math.ceil(this.powerUpTimer / 1000);
            this.powerUpText.setText(`Power-up: ${timeLeft}s`);
        } else {
            this.powerUpText.setText('');
        }
    }

    togglePause() {
        if (this.gameOver) return;
        
        if (this.scene.isPaused()) {
            this.scene.resume();
        } else {
            this.scene.pause();
        }
    }
}

// Advanced Bird Class with Enhanced Features
class AdvancedBird extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bird');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setBounce(0.2);
        this.setGravityY(800);
        
        this.flapVelocity = -400;
        this.maxVelocity = 600;
        this.rotationSpeed = 0.1;
        this.invincible = false;
        this.flapCooldown = 0;
        
        // Animation
        this.anims.create({
            key: 'fly',
            frames: [
                { key: 'bird' },
                { key: 'bird_fly' }
            ],
            frameRate: 10,
            repeat: -1
        });
        
        this.play('fly');
    }

    update(time, delta) {
        this.handleRotation();
        
        if (this.flapCooldown > 0) {
            this.flapCooldown -= delta;
        }
        
        if (this.body.velocity.y > this.maxVelocity) {
            this.body.velocity.y = this.maxVelocity;
        }
    }

    handleRotation() {
        const targetAngle = this.body.velocity.y < 0 ? -20 : 90;
        const currentAngle = this.angle;
        
        if (currentAngle < targetAngle) {
            this.angle += this.rotationSpeed * 16;
        } else if (currentAngle > targetAngle) {
            this.angle -= this.rotationSpeed * 16;
        }
    }

    flap() {
        if (this.flapCooldown > 0) return false;
        
        this.setVelocityY(this.flapVelocity);
        this.flapCooldown = 100;
        
        this.scene.events.emit('birdFlapped');
        return true;
    }

    setInvincible(invincible) {
        this.invincible = invincible;
        if (invincible) {
            this.setTint(0xFFFF00);
        } else {
            this.clearTint();
        }
    }

    die() {
        if (this.invincible) return;
        
        this.body.setVelocity(0, 0);
        this.body.setGravity(0, 0);
        this.setTint(0xff0000);
        
        this.scene.events.emit('birdDied');
    }
}

// Advanced Pipe Manager
class AdvancedPipeManager {
    constructor(scene) {
        this.scene = scene;
        this.pipePairs = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        this.currentSpeed = 200;
        this.maxSpeed = 400;
        this.isSpawning = false;
    }

    startSpawning() {
        this.isSpawning = true;
        this.spawnPipePair();
    }

    update(time, delta) {
        if (!this.isSpawning) return;
        
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnPipePair();
            this.spawnTimer = 0;
        }
        
        this.pipePairs.forEach(pair => pair.update());
        this.pipePairs = this.pipePairs.filter(pair => 
            pair.topPipe.active && pair.bottomPipe.active
        );
    }

    spawnPipePair() {
        const x = 800;
        const y = Phaser.Math.Between(200, 400);
        const gap = Phaser.Math.Between(120, 200);
        
        const pipePair = new AdvancedPipePair(this.scene, x, y, gap);
        pipePair.setSpeed(this.currentSpeed);
        
        this.pipePairs.push(pipePair);
        
        // Increase speed gradually
        if (this.currentSpeed < this.maxSpeed) {
            this.currentSpeed += 2;
        }
    }

    setSpeed(speed) {
        this.currentSpeed = speed;
        this.pipePairs.forEach(pair => pair.setSpeed(speed));
    }
}

// Advanced Pipe Pair
class AdvancedPipePair {
    constructor(scene, x, y, gap = 150) {
        this.scene = scene;
        this.gap = gap;
        this.passed = false;
        
        this.topPipe = scene.physics.add.sprite(x, y - gap/2, 'pipe');
        this.topPipe.setAngle(180);
        this.topPipe.setImmovable(true);
        
        this.bottomPipe = scene.physics.add.sprite(x, y + gap/2, 'pipe');
        this.bottomPipe.setImmovable(true);
        
        // Add collision with bird
        scene.physics.add.collider(scene.bird, this.topPipe, () => scene.bird.die());
        scene.physics.add.collider(scene.bird, this.bottomPipe, () => scene.bird.die());
    }

    update() {
        this.topPipe.setVelocityX(-this.scene.pipeManager.currentSpeed);
        this.bottomPipe.setVelocityX(-this.scene.pipeManager.currentSpeed);
        
        if (!this.passed && this.topPipe.x < 150) {
            this.passed = true;
            this.scene.events.emit('pipePassed');
        }
        
        if (this.topPipe.x < -100) {
            this.topPipe.destroy();
            this.bottomPipe.destroy();
        }
    }

    setSpeed(speed) {
        this.topPipe.setVelocityX(-speed);
        this.bottomPipe.setVelocityX(-speed);
    }
}

// Power-up Manager
class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
        this.powerUps = [];
        this.spawnTimer = 0;
        this.spawnInterval = 5000; // 5 seconds
        this.isSpawning = false;
    }

    startSpawning() {
        this.isSpawning = true;
    }

    update(time, delta) {
        if (!this.isSpawning) return;
        
        this.spawnTimer += delta;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnPowerUp();
            this.spawnTimer = 0;
        }
        
        this.powerUps.forEach(powerUp => powerUp.update());
        this.powerUps = this.powerUps.filter(powerUp => powerUp.active);
    }

    spawnPowerUp() {
        const x = 800;
        const y = Phaser.Math.Between(100, 500);
        
        const powerUp = this.scene.physics.add.sprite(x, y, 'powerup');
        powerUp.setVelocityX(-150);
        
        // Add collision with bird
        this.scene.physics.add.overlap(
            this.scene.bird, 
            powerUp, 
            () => {
                powerUp.destroy();
                this.scene.events.emit('powerUpCollected');
            }
        );
        
        this.powerUps.push(powerUp);
    }
}

// Manager Classes
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = new Map();
    }
    
    playSound(key) {
        // Placeholder for sound effects
        console.log(`Playing sound: ${key}`);
    }
}

class ParticleManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = scene.add.particles('particle');
    }
    
    createFlapEffect(x, y) {
        this.particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 50, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            frequency: 50,
            quantity: 5
        });
    }
    
    createScoreEffect(x, y) {
        this.particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 100, max: 200 },
            angle: { min: -30, max: 30 },
            scale: { start: 1, end: 0 },
            lifespan: 1000,
            frequency: 100,
            quantity: 10,
            tint: 0xFFD700
        });
    }
    
    createPowerUpEffect(x, y) {
        this.particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 150, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 1500,
            frequency: 50,
            quantity: 20,
            tint: 0xFFD700
        });
    }
    
    createDeathEffect(x, y) {
        this.particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 200, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 2000,
            frequency: 20,
            quantity: 30,
            tint: 0xFF0000
        });
    }
    
    update() {
        // Clean up expired emitters
    }
}

class ScoreManager {
    constructor(scene) {
        this.scene = scene;
    }
    
    updateScore(score) {
        // Handle score updates
    }
}

// Advanced Game Over Scene
class AdvancedGameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AdvancedGameOverScene' });
    }

    init(data) {
        this.score = data.score || 0;
        this.highScore = data.highScore || 0;
        this.maxCombo = data.maxCombo || 0;
    }

    create() {
        this.add.image(400, 300, 'background');

        // Game Over text with animation
        const gameOverText = this.add.text(400, 150, 'GAME OVER', {
            fontSize: '48px',
            fill: '#FF0000',
            fontFamily: 'Arial',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Animate game over text
        this.tweens.add({
            targets: gameOverText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Score display
        this.add.text(400, 250, `Score: ${this.score}`, {
            fontSize: '32px',
            fill: '#000',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 290, `High Score: ${this.highScore}`, {
            fontSize: '24px',
            fill: '#FFD700',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(400, 330, `Max Combo: ${this.maxCombo}`, {
            fontSize: '20px',
            fill: '#FF00FF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Buttons
        const playAgainButton = this.add.text(400, 400, 'PLAY AGAIN', {
            fontSize: '24px',
            fill: '#000',
            fontFamily: 'Arial',
            backgroundColor: '#FFF',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        const menuButton = this.add.text(400, 450, 'MAIN MENU', {
            fontSize: '24px',
            fill: '#000',
            fontFamily: 'Arial',
            backgroundColor: '#FFF',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Make buttons interactive
        playAgainButton.setInteractive();
        menuButton.setInteractive();

        playAgainButton.on('pointerdown', () => {
            this.scene.start('AdvancedGameScene');
        });

        menuButton.on('pointerdown', () => {
            this.scene.start('AdvancedMenuScene');
        });

        // Add hover effects
        [playAgainButton, menuButton].forEach(button => {
            button.on('pointerover', () => button.setScale(1.1));
            button.on('pointerout', () => button.setScale(1));
        });
    }
}

// Initialize the advanced game
new AdvancedFlappyBirdGame(); 