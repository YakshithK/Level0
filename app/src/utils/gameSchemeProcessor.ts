import { GameSchema, DEFAULT_GAME_SCHEME } from '../types/gameSchema';
import { THEME_CONFIGS } from '../config/ThemeConfig';
import { ABILITY_CODE_SNIPPETS } from './mappings';

// Add GameConfig interface for Phaser
export interface GameConfig {
  backgroundColor: string;
  gravity: { x: number; y: number };
  player: {
    x: number;
    y: number;
    size: number;
    color: number;
    bounce: number;
  };
  platforms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    color: number;
  }>;
  controls: {
    left: string;
    right: string;
    jump: string;
    dash?: string;
    shoot?: string;
  };
  enemies?: Array<{
    type: string;
    x: number;
    y: number;
    color: number;
  }>;
  goal?: string;
}

export class GameSchemeProcessor {
  private scheme: GameSchema;

  constructor(scheme: Partial<GameSchema> = {}) {
    this.scheme = { ...DEFAULT_GAME_SCHEME, ...scheme };
  }

  // Convert game scheme to Phaser-ready config
  public toGameConfig(): GameConfig {
    const themeConfig = THEME_CONFIGS[this.scheme.theme] || THEME_CONFIGS.lava;
    
    return {
      backgroundColor: themeConfig.backgroundColor,
      gravity: { x: 0, y: 600 },
      player: {
        x: 100,
        y: 100,
        size: 30,
        color: themeConfig.playerColor,
        bounce: 0.3,
      },
      platforms: this.generatePlatforms(themeConfig),
      controls: this.generateControls(),
      enemies: this.generateEnemies(themeConfig),
      goal: this.scheme.goal
    };
  }

  private generatePlatforms(themeConfig: any): Array<any> {
    const platforms = [];
    const { count } = this.scheme.platforms;
    
    for (let i = 0; i < count; i++) {
      platforms.push({
        x: 200 + (i * 150),
        y: 500 - (i * 80),
        width: 150 + Math.random() * 100,
        height: 20,
        color: themeConfig.platformColors[i % themeConfig.platformColors.length]
      });
    }
    
    return platforms;
  }

  private generateControls(): any {
    const controls: any = {
      left: "LEFT",
      right: "RIGHT",
      jump: "SPACE"
    };

    // Add additional controls based on abilities
    if (this.scheme.playerAbilities.includes('dash')) {
      controls.dash = "SHIFT";
    }
    if (this.scheme.playerAbilities.includes('shoot')) {
      controls.shoot = "X";
    }

    return controls;
  }

  private generateEnemies(themeConfig: any): Array<any> {
    const enemies = [];
    
    this.scheme.enemies.forEach((enemyType, index) => {
      enemies.push({
        type: enemyType,
        x: 400 + (index * 200),
        y: 450,
        color: themeConfig.enemyColors[index % themeConfig.enemyColors.length]
      });
    });
    
    return enemies;
  }

  // Generate Phaser code based on the scheme
  public generatePhaserCode(): string {
    return this.buildSceneCode();
  }

  private buildSceneCode(): string {
    const themeConfig = THEME_CONFIGS[this.scheme.theme];
    const hasDoubleJump = this.scheme.playerAbilities.includes('doubleJump');
    const hasDash = this.scheme.playerAbilities.includes('dash');
    const hasWallJump = this.scheme.playerAbilities.includes('wallJump');
    return `class DynamicScene extends Phaser.Scene {
  constructor() {
    super({ key: "DynamicScene" });
  }

  create() {
    // Set background
    this.cameras.main.setBackgroundColor('#2d1b1b');
    
    // Create player
    this.player = this.add.rectangle(100, 100, 32, 32, 16739125);
    this.physics.add.existing(this.player, false);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setBounce(0.3, 0.3);
    
    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    
    // Add left wall
    const leftWall = this.add.rectangle(10, 300, 20, 600, 0x888888);
    this.physics.add.existing(leftWall, true);
    this.platforms.add(leftWall);
    // Add right wall (move to x=800)
    const rightWall = this.add.rectangle(800, 300, 20, 600, 0x888888);
    this.physics.add.existing(rightWall, true);
    this.platforms.add(rightWall);
    // Add ground
    const ground = this.add.rectangle(400, 590, 800, 20, 0x888888);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
    
    const platform0 = this.add.rectangle(200, 500, 237, 20, 16729344);
    this.physics.add.existing(platform0, true);
    this.platforms.add(platform0);
    const platform1 = this.add.rectangle(350, 420, 163, 20, 16737095);
    this.physics.add.existing(platform1, true);
    this.platforms.add(platform1);
    const platform2 = this.add.rectangle(500, 340, 217, 20, 16729344);
    this.physics.add.existing(platform2, true);
    this.platforms.add(platform2);
    const platform3 = this.add.rectangle(650, 260, 184, 20, 16729344);
    this.physics.add.existing(platform3, true);
    this.platforms.add(platform3);
    
    // Create enemies
    ${this.generateEnemyCode()}
    
    // Create projectiles group for shooting
    ${this.scheme.playerAbilities.includes('shoot') ? 'this.projectiles = this.physics.add.group();' : ''}
    
    // Create goal
    ${this.generateGoalCode()}
    
    // Add collisions
    this.physics.add.collider(this.player, this.platforms);
    // Add enemy collisions
    this.enemies.forEach(enemy => {
      this.physics.add.collider(this.player, enemy, this.handleEnemyCollision, null, this);
    });
    
    ${this.scheme.playerAbilities.includes('shoot') ? `
    // Add projectile collisions
    this.physics.add.collider(this.projectiles, this.enemies, this.handleProjectileHit, null, this);
    this.physics.add.collider(this.projectiles, this.platforms, this.handleProjectileWall, null, this);` : ''}
    
    // Setup controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      x: Phaser.Input.Keyboard.KeyCodes.X
    });
    
    // Player state
    this.playerState = {
      ${hasDoubleJump ? 'hasDoubleJumped: false,' : ''}
      ${hasDash ? `dashCooldown: 0,
      dashing: false,
      dashTime: 0,
      dashDirection: 1,` : ''}
      isOnWall: false,
      wallJumpCooldown: 0,
      canDoubleJump: ${hasDoubleJump},
      canDash: ${hasDash},
      canShoot: ${this.scheme.playerAbilities.includes('shoot')},
      shootCooldown: 0,
      canWallJump: ${hasWallJump},
      wallJumpLockDir: null, // 'left' or 'right'
      wallJumpLockTimer: 0,
    };
  }

  update() {
    const speed = 200;
    const jumpSpeed = -400;
    // Reset velocity
    this.player.body.setVelocityX(0);
    // Get input state
    const left = this.cursors.left.isDown || this.wasd.a.isDown;
    const right = this.cursors.right.isDown || this.wasd.d.isDown;
    const shoot = this.cursors.shift.isDown || this.wasd.x.isDown;
    // --- WALL JUMP LOCK LOGIC ---
    if (this.playerState.wallJumpLockTimer > 0) {
      this.playerState.wallJumpLockTimer--;
      if (this.playerState.wallJumpLockTimer === 0) {
        this.playerState.wallJumpLockDir = null;
      }
    }
    let moveLeft = left;
    let moveRight = right;
    if (this.playerState.wallJumpLockDir === 'left') moveLeft = false;
    if (this.playerState.wallJumpLockDir === 'right') moveRight = false;
    // Move left/right
    if (moveLeft) {
      this.player.body.setVelocityX(-speed);
    } else if (moveRight) {
      this.player.body.setVelocityX(speed);
    }
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.w);
    this.playerState.isOnWall = this.player.body.blocked.left || this.player.body.blocked.right;
    if (this.playerState.wallJumpCooldown > 0) {
      this.playerState.wallJumpCooldown--;
    }
    if (jumpPressed) {
      if (
        this.playerState.isOnWall &&
        !this.player.body.blocked.down &&
        this.playerState.wallJumpCooldown === 0
      ) {
        // WALL JUMP
        const wallJumpHorizontal = 1000;
        const wallJumpVertical = -350;
        const wallJumpX = this.player.body.blocked.left ? wallJumpHorizontal : -wallJumpHorizontal;
        this.player.body.setVelocity(wallJumpX, wallJumpVertical);
        this.playerState.wallJumpCooldown = 10;
        // Lock input toward the wall for 10 frames
        this.playerState.wallJumpLockDir = this.player.body.blocked.left ? 'left' : 'right';
        this.playerState.wallJumpLockTimer = 10;
      } else if (this.player.body.blocked.down) {
        // NORMAL JUMP
        this.player.body.setVelocityY(jumpSpeed);
      }
    }
    if (!this.debugText) {
      this.debugText = this.add.text(10, 30, '', { color: '#fff' });
    }
  }

  ${this.generateHelperMethods()}
}`;
  }

  private generatePlatformCode(): string {
    const themeConfig = THEME_CONFIGS[this.scheme.theme];
    let code = '';
    
    for (let i = 0; i < this.scheme.platforms.count; i++) {
      const color = themeConfig.platformColors[i % themeConfig.platformColors.length];
      const x = 200 + (i * 150);
      const y = 500 - (i * 80);
      const width = 150 + Math.floor(Math.random() * 100);
      
      if (this.scheme.platforms.moving && i % 2 === 0) {
        // Create moving platform
        code += `
    const platform${i} = this.add.rectangle(${x}, ${y}, ${width}, 20, ${color});
    this.physics.add.existing(platform${i}, true);
    platform${i}.body.setImmovable(true);
    platform${i}.body.setVelocityX(50);
    platform${i}.body.setBounceX(1);
    this.platforms.add(platform${i});`;
      } else {
        // Create static platform
        code += `
    const platform${i} = this.add.rectangle(${x}, ${y}, ${width}, 20, ${color});
    this.physics.add.existing(platform${i}, true);
    this.platforms.add(platform${i});`;
      }
    }
    
    return code;
  }

  private generateEnemyCode(): string {
    if (this.scheme.enemies.length === 0) return 'this.enemies = [];';
    
    let code = 'this.enemies = [];';
    
    this.scheme.enemies.forEach((enemyType, i) => {
      const themeConfig = THEME_CONFIGS[this.scheme.theme];
      const color = themeConfig.enemyColors[i % themeConfig.enemyColors.length];
      const x = 400 + (i * 200);
      
      switch (enemyType) {
        case 'patrol':
          code += `
    const ${enemyType}${i} = this.add.rectangle(${x}, 450, 20, 20, ${color});
    this.physics.add.existing(${enemyType}${i}, true);
    ${enemyType}${i}.body.setImmovable(true);
    ${enemyType}${i}.body.setVelocityX(100);
    ${enemyType}${i}.body.setBounceX(1);
    ${enemyType}${i}.patrolDirection = 1;
    this.enemies.push(${enemyType}${i});`;
          break;
        case 'shooter':
          code += `
    const ${enemyType}${i} = this.add.rectangle(${x}, 450, 20, 20, ${color});
    this.physics.add.existing(${enemyType}${i}, true);
    ${enemyType}${i}.body.setImmovable(true);
    ${enemyType}${i}.shootTimer = 0;
    this.enemies.push(${enemyType}${i});`;
          break;
        case 'boss':
          code += `
    const ${enemyType}${i} = this.add.rectangle(${x}, 450, 40, 40, ${color});
    this.physics.add.existing(${enemyType}${i}, true);
    ${enemyType}${i}.body.setImmovable(true);
    ${enemyType}${i}.health = 3;
    ${enemyType}${i}.attackTimer = 0;
    this.enemies.push(${enemyType}${i});`;
          break;
        default: // spike, slime
          code += `
    const ${enemyType}${i} = this.add.rectangle(${x}, 450, 20, 20, ${color});
    this.physics.add.existing(${enemyType}${i}, true);
    this.enemies.push(${enemyType}${i});`;
      }
    });
    
    return code;
  }

  private generateEnemyUpdateCode(): string {
    let code = '';
    
    this.scheme.enemies.forEach((enemyType, i) => {
      switch (enemyType) {
        case 'patrol':
          code += `
    // Update patrol enemy ${i}
    const patrol${i} = this.enemies[${i}];
    if (patrol${i} && patrol${i}.body) {
      if (patrol${i}.body.blocked.left || patrol${i}.body.blocked.right) {
        patrol${i}.body.setVelocityX(-patrol${i}.body.velocity.x);
      }
    }`;
          break;
        case 'shooter':
          code += `
    // Update shooter enemy ${i}
    const shooter${i} = this.enemies[${i}];
    if (shooter${i} && this.player) {
      shooter${i}.shootTimer++;
      if (shooter${i}.shootTimer > 120) { // Shoot every 2 seconds
        this.createEnemyProjectile(shooter${i}, this.player);
        shooter${i}.shootTimer = 0;
      }
    }`;
          break;
        case 'boss':
          code += `
    // Update boss enemy ${i}
    const boss${i} = this.enemies[${i}];
    if (boss${i} && this.player) {
      boss${i}.attackTimer++;
      if (boss${i}.attackTimer > 180) { // Attack every 3 seconds
        this.createBossAttack(boss${i}, this.player);
        boss${i}.attackTimer = 0;
      }
    }`;
          break;
      }
    });
    
    return code;
  }

  private generateGoalCode(): string {
    switch (this.scheme.goal) {
      case 'portal':
        return `
    // Create portal goal
    this.portal = this.add.rectangle(750, 100, 40, 40, 0x00ff00);
    this.physics.add.existing(this.portal, true);
    this.physics.add.overlap(this.player, this.portal, this.handleWin, null, this);`;
      case 'survival':
        return `
    // Survival mode - no specific goal, just survive
    this.gameTimer = 60; // 60 seconds
    this.timeText = this.add.text(10, 10, 'Time: ' + this.gameTimer, { color: '#ffffff' });
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.gameTimer--;
        if (this.timeText) this.timeText.setText('Time: ' + this.gameTimer);
        if (this.gameTimer <= 0) {
          this.handleWin();
        }
      },
      loop: true
    });`;
      case 'collectible':
        return `
    // Collectible goal
    this.collectibles = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
      const collectible = this.add.rectangle(300 + i * 100, 200 + i * 50, 15, 15, 0xffff00);
      this.physics.add.existing(collectible, true);
      this.collectibles.add(collectible);
    }
    this.physics.add.overlap(this.player, this.collectibles, this.handleCollectible, null, this);
    this.collectedCount = 0;
    this.collectibleText = this.add.text(10, 10, 'Collectibles: 0/5', { color: '#ffffff' });`;
      case 'boss':
        return `
    // Boss battle goal
    this.bossDefeated = false;`;
      case 'time':
        return `
    // Time trial goal
    this.timeLimit = 30; // 30 seconds
    this.timeText = this.add.text(10, 10, 'Time: ' + this.timeLimit, { color: '#ffffff' });
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLimit--;
        if (this.timeText) this.timeText.setText('Time: ' + this.timeLimit);
        if (this.timeLimit <= 0) {
          this.scene.restart();
        }
      },
      loop: true
    });`;
      default:
        return '';
    }
  }

  private generateHelperMethods(): string {
    let code = `
  handleEnemyCollision(player, enemy) {
    // Handle player-enemy collision
    this.scene.restart();
  }

  handleWin(player, portal) {
    // Handle win condition
    this.add.text(400, 300, 'YOU WIN!', { 
      fontSize: '32px', 
      color: '#00ff00' 
    }).setOrigin(0.5);
  }`;

    // Add shooting methods if shooting ability is enabled
    if (this.scheme.playerAbilities.includes('shoot')) {
      code += `

  createPlayerProjectile() {
    const projectile = this.add.rectangle(this.player.x, this.player.y, 8, 8, 0xffff00);
    this.physics.add.existing(projectile, false);
    projectile.body.setVelocityX(this.player.body.velocity.x > 0 ? 400 : -400);
    this.projectiles.add(projectile);
    
    // Remove projectile after 2 seconds
    this.time.delayedCall(2000, () => {
      if (projectile.active) {
        projectile.destroy();
      }
    });
  }

  createEnemyProjectile(enemy, target) {
    const projectile = this.add.rectangle(enemy.x, enemy.y, 6, 6, 0xff0000);
    this.physics.add.existing(projectile, false);
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
    const velocity = this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), 200);
    projectile.body.setVelocity(velocity.x, velocity.y);
    
    // Remove projectile after 3 seconds
    this.time.delayedCall(3000, () => {
      if (projectile.active) {
        projectile.destroy();
      }
    });
  }

  handleProjectileHit(projectile, enemy) {
    projectile.destroy();
    if (enemy.health) {
      enemy.health--;
      if (enemy.health <= 0) {
        enemy.destroy();
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
          this.enemies.splice(index, 1);
        }
      }
    } else {
      enemy.destroy();
      const index = this.enemies.indexOf(enemy);
      if (index > -1) {
        this.enemies.splice(index, 1);
      }
    }
  }

  handleProjectileWall(projectile, wall) {
    projectile.destroy();
  }`;
    }

    // Add collectible handling if collectible goal is enabled
    if (this.scheme.goal === 'collectible') {
      code += `

  handleCollectible(player, collectible) {
    collectible.destroy();
    this.collectedCount++;
    if (this.collectibleText) {
      this.collectibleText.setText('Collectibles: ' + this.collectedCount + '/5');
    }
    if (this.collectedCount >= 5) {
      this.handleWin();
    }
  }`;
    }

    return code;
  }
}