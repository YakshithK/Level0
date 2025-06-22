import { GameSchema, DEFAULT_GAME_SCHEME } from '../types/gameSchema';
import { THEME_CONFIGS } from '../config/ThemeConfig';
import { ABILITY_CODE_SNIPPETS, ENEMY_CODE_SNIPPETS } from './mappings';

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
    const { count, moving, type } = this.scheme.platforms;
    
    // Generate random but sensible platform positions
    const platformPositions = this.generateRandomPlatformPositions(count);
    
    for (let i = 0; i < count; i++) {
      const pos = platformPositions[i];
      const platformType = type || 'solid';
      
      // If moving platforms are enabled, make about half of them moving
      // Skip the first platform (ground) to ensure player has a stable starting point
      const isMoving = moving && i > 0 && (i % 2 === 0 || Math.random() < 0.5);
      
      platforms.push({
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: 20,
        color: themeConfig.platformColors[i % themeConfig.platformColors.length],
        type: platformType,
        moving: isMoving,
        index: i
      });
    }
    
    return platforms;
  }

  private generateRandomPlatformPositions(count: number): Array<{x: number, y: number, width: number}> {
    const positions = [];
    const gameWidth = 800;
    const gameHeight = 600;
    const minJumpDistance = 120; // Minimum distance player can jump
    const maxJumpDistance = 200; // Maximum comfortable jump distance
    
    // Start with a ground platform for the player
    positions.push({
      x: 100,
      y: 500,
      width: 150 + Math.random() * 100
    });
    
    // Generate additional platforms
    for (let i = 1; i < count; i++) {
      let attempts = 0;
      let validPosition = false;
      let x, y, width;
      
      while (!validPosition && attempts < 50) {
        // Random position within game bounds
        x = 50 + Math.random() * (gameWidth - 200);
        y = 200 + Math.random() * (gameHeight - 300); // Keep platforms in playable area
        width = 100 + Math.random() * 150; // Random width between 100-250
        
        // Check if position is valid (reachable from existing platforms)
        validPosition = this.isPlatformPositionValid(x, y, positions, minJumpDistance, maxJumpDistance);
        attempts++;
      }
      
      if (validPosition) {
        positions.push({ x, y, width });
      } else {
        // Fallback: place platform near a random existing one
        const randomExisting = positions[Math.floor(Math.random() * positions.length)];
        positions.push({
          x: randomExisting.x + (Math.random() - 0.5) * 200,
          y: randomExisting.y - 60 - Math.random() * 80,
          width: 120 + Math.random() * 80
        });
      }
    }
    
    return positions;
  }

  private isPlatformPositionValid(x: number, y: number, existingPositions: Array<{x: number, y: number, width: number}>, minJump: number, maxJump: number): boolean {
    // Check if platform is reachable from at least one existing platform
    for (const existing of existingPositions) {
      const distanceX = Math.abs(x - existing.x);
      const distanceY = Math.abs(y - existing.y);
      
      // Horizontal distance should be within jump range
      if (distanceX >= minJump && distanceX <= maxJump) {
        // Vertical distance should be reasonable for jumping
        if (distanceY >= 40 && distanceY <= 120) {
          return true;
        }
      }
    }
    
    return false;
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
    const hasShoot = this.scheme.playerAbilities.includes('shoot');
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
    this.movingPlatforms = this.physics.add.group();
    
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
    
    ${this.generatePlatformCode()}
    
    // Create enemies
    ${this.generateEnemyCode()}
    
    // Create projectiles group for shooting
    ${this.scheme.playerAbilities.includes('shoot') || this.scheme.enemies.includes('shooter') ? 'this.projectiles = this.physics.add.group();' : ''}
    ${this.generateAbilityCode()}
    
    // Create goal
    ${this.generateGoalCode()}
    
    // Add collisions
    this.physics.add.collider(this.player, this.platforms, this.handlePlatformCollision, null, this);
    this.physics.add.collider(this.player, this.movingPlatforms, this.handlePlatformCollision, null, this);
    // Add enemy collisions
    this.enemies.forEach(enemy => {
      this.physics.add.collider(this.player, enemy, this.handleEnemyCollision, null, this);
    });
    
    // Add enemy-platform collisions so enemies don't phase through platforms
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.movingPlatforms);
    
    // Ensure moving platforms are solid for player collision
    this.movingPlatforms.children.entries.forEach(platform => {
      if (platform.type === 'moving') {
        platform.body.setAllowGravity(false);
        platform.body.setImmovable(true);
        platform.body.setCollideWorldBounds(false);
      }
    });
    
    ${this.scheme.playerAbilities.includes('shoot') ? `
    // Add projectile collisions
    this.physics.add.collider(this.projectiles, this.enemies, this.handleProjectileHit, null, this);
    this.physics.add.collider(this.projectiles, this.platforms, this.handleProjectileWall, null, this);` : ''}
    
    ${this.scheme.enemies.includes('shooter') ? `
    // Add enemy projectile collisions with player
    this.physics.add.collider(this.projectiles, this.player, this.handlePlayerHitByProjectile, null, this);` : ''}
    
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
      canShoot: ${hasShoot},
      shootCooldown: 0,
      canWallJump: ${hasWallJump},
      wallJumpLockDir: null, // 'left' or 'right'
      wallJumpLockTimer: 0,
      facing: 'right', // Track which way the player is facing
      health: 3, // Player has 3 lives
    };
    
    // Create health bar (always displayed)
    this.healthBar = this.add.rectangle(100, 30, 200, 20, 0x333333);
    this.healthBar.setOrigin(0, 0);
    this.healthBar.setStrokeStyle(2, 0xffffff);
    this.healthText = this.add.text(10, 10, 'Health: 3', { 
      fontSize: '16px', 
      color: '#ffffff' 
    });
  }

  update() {
    ${this.generateMovementCode()}
    ${this.generateEnemyUpdateCode()}
    this.updatePlatforms();
    if (!this.debugText) {
      this.debugText = this.add.text(10, 30, '', { color: '#fff' });
    }
  }

  ${this.generateHelperMethods()}
}`;
  }

  private generatePlatformCode(): string {
    const themeConfig = THEME_CONFIGS[this.scheme.theme];
    const platformData = this.generatePlatforms(themeConfig);
    let code = '';
    
    platformData.forEach((platform, i) => {
      const { x, y, width, height, color, type, moving, index } = platform;
      
      if (type === 'floating') {
        // Floating platform - no physics body, just visual
        code += `
    const platform${index} = this.add.rectangle(${x}, ${y}, ${width}, ${height}, ${color});
    platform${index}.setAlpha(0.7); // Semi-transparent
    platform${index}.type = 'floating';`;
      } else if (type === 'breakable') {
        // Breakable platform - disappears when player touches it
        code += `
    const platform${index} = this.add.rectangle(${x}, ${y}, ${width}, ${height}, ${color});
    this.physics.add.existing(platform${index}, true);
    platform${index}.type = 'breakable';
    platform${index}.health = 1;
    this.platforms.add(platform${index});`;
      } else {
        // Solid platform - normal physics
        if (moving) {
          // Moving platform: use dynamic body
          code += `
    const platform${index} = this.add.rectangle(${x}, ${y}, ${width}, ${height}, ${color});
    this.physics.add.existing(platform${index}, false);
    platform${index}.body.setAllowGravity(false);
    platform${index}.body.setVelocityX(0);
    platform${index}.body.setBounceX(1);
    platform${index}.body.setCollideWorldBounds(false);
    platform${index}.type = 'moving';
    platform${index}.moveDirection = 1;
    platform${index}.startX = ${x};
    platform${index}.startY = ${y};
    platform${index}.moveRange = 200;
    platform${index}.moveSpeed = 2;
    this.movingPlatforms.add(platform${index});`;
        } else {
          // Static solid platform
          code += `
    const platform${index} = this.add.rectangle(${x}, ${y}, ${width}, ${height}, ${color});
    this.physics.add.existing(platform${index}, true);
    platform${index}.type = 'solid';
    this.platforms.add(platform${index});`;
        }
      }
    });
    
    return code;
  }

  private generateEnemyCode(): string {
    if (this.scheme.enemies.length === 0) return 'this.enemies = [];';
    
    let code = 'this.enemies = [];';
    let enemyIndex = 0;
    
    // Get platform data for enemy placement
    const themeConfig = THEME_CONFIGS[this.scheme.theme];
    const platformData = this.generatePlatforms(themeConfig);
    
    this.scheme.enemies.forEach((enemyType, i) => {
      const color = themeConfig.enemyColors[i % themeConfig.enemyColors.length];
      
      if (enemyType === 'spike' || enemyType === 'slime') {
        // Create multiple spikes/slimes - one per platform
        for (let platformIndex = 0; platformIndex < platformData.length; platformIndex++) {
          const platform = platformData[platformIndex];
          const x = platform.x + (Math.random() * platform.width - platform.width/2); // Random position on platform
          const y = platform.y - 20; // Slightly above platform surface
          
          code += ENEMY_CODE_SNIPPETS[enemyType].create(enemyIndex, x, y, color);
          enemyIndex++;
        }
      } else if (enemyType === 'shooter') {
        // Place shooters on platforms instead of ground
        for (let platformIndex = 0; platformIndex < platformData.length; platformIndex++) {
          const platform = platformData[platformIndex];
          const x = platform.x + (Math.random() * platform.width - platform.width/2); // Random position on platform
          const y = platform.y - 30; // Above platform surface
          
          code += (ENEMY_CODE_SNIPPETS as any)[enemyType].create(enemyIndex, x, y, color);
          enemyIndex++;
        }
      } else if (enemyType === 'boss') {
        // Place boss on a high platform for better positioning
        const platformX = 400; // Center platform
        const platformY = 340; // Higher platform (platform2)
        const x = platformX + (Math.random() * 100 - 50); // Random position on platform
        const y = platformY - 40; // Above platform surface
        
        code += (ENEMY_CODE_SNIPPETS as any)[enemyType].create(enemyIndex, x, y, color);
        enemyIndex++;
      } else {
        // Other enemies on ground
        const x = 400 + (enemyIndex * 200);
        const y = 450;
        
        // Use modular enemy snippets
        if ((ENEMY_CODE_SNIPPETS as any)[enemyType]) {
          code += (ENEMY_CODE_SNIPPETS as any)[enemyType].create(enemyIndex, x, y, color);
        } else {
          // Fallback for unknown enemy types
          code += `
    const ${enemyType}${enemyIndex} = this.add.rectangle(${x}, ${y}, 20, 20, ${color});
    this.physics.add.existing(${enemyType}${enemyIndex}, true);
    this.enemies.push(${enemyType}${enemyIndex});`;
        }
        enemyIndex++;
      }
    });
    
    return code;
  }

  private generateEnemyUpdateCode(): string {
    let code = '';
    let enemyIndex = 0;
    
    this.scheme.enemies.forEach((enemyType, i) => {
      if (enemyType === 'spike' || enemyType === 'slime') {
        // Multiple enemies per type - run update for each one
        for (let platformIndex = 0; platformIndex < this.scheme.platforms.count; platformIndex++) {
          if (ENEMY_CODE_SNIPPETS[enemyType] && ENEMY_CODE_SNIPPETS[enemyType].update) {
            code += ENEMY_CODE_SNIPPETS[enemyType].update(enemyIndex);
          }
          enemyIndex++;
        }
      } else if (enemyType === 'shooter') {
        // Multiple shooters per type - run update for each one
        for (let platformIndex = 0; platformIndex < this.scheme.platforms.count; platformIndex++) {
          if (ENEMY_CODE_SNIPPETS[enemyType] && ENEMY_CODE_SNIPPETS[enemyType].update) {
            code += ENEMY_CODE_SNIPPETS[enemyType].update(enemyIndex);
          }
          enemyIndex++;
        }
      } else if (enemyType === 'boss') {
        // Single boss per type
        if ((ENEMY_CODE_SNIPPETS as any)[enemyType] && (ENEMY_CODE_SNIPPETS as any)[enemyType].update) {
          code += (ENEMY_CODE_SNIPPETS as any)[enemyType].update(enemyIndex);
        }
        enemyIndex++;
      } else {
        // Single enemy per type
        if ((ENEMY_CODE_SNIPPETS as any)[enemyType] && (ENEMY_CODE_SNIPPETS as any)[enemyType].update) {
          code += (ENEMY_CODE_SNIPPETS as any)[enemyType].update(enemyIndex);
        }
        enemyIndex++;
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
    this.playerState.health--;
    this.healthText.setText('Health: ' + this.playerState.health);
    
    // Update health bar width based on remaining health
    const healthPercentage = this.playerState.health / 3;
    this.healthBar.width = 200 * healthPercentage;
    
    // Change health bar color based on health
    if (this.playerState.health === 3) {
      this.healthBar.fillColor = 0x00ff00; // Green
    } else if (this.playerState.health === 2) {
      this.healthBar.fillColor = 0xffff00; // Yellow
    } else {
      this.healthBar.fillColor = 0xff0000; // Red
    }
    
    if (this.playerState.health <= 0) {
      this.scene.restart();
    }
  }

  handleWin(player, portal) {
    // Handle win condition
    this.add.text(400, 300, 'YOU WIN!', { 
      fontSize: '32px', 
      color: '#00ff00' 
    }).setOrigin(0.5);
  }

  handlePlayerHitByProjectile(projectile, player) {
    // Handle player hit by enemy projectile
    this.playerState.health--;
    this.healthText.setText('Health: ' + this.playerState.health);
    
    // Update health bar width based on remaining health
    const healthPercentage = this.playerState.health / 3;
    this.healthBar.width = 200 * healthPercentage;
    
    // Change health bar color based on health
    if (this.playerState.health === 3) {
      this.healthBar.fillColor = 0x00ff00; // Green
    } else if (this.playerState.health === 2) {
      this.healthBar.fillColor = 0xffff00; // Yellow
    } else {
      this.healthBar.fillColor = 0xff0000; // Red
    }
    
    if (this.playerState.health <= 0) {
      this.scene.restart();
    }
  }

  updatePlatforms() {
    // Update moving platforms
    this.movingPlatforms.children.entries.forEach(platform => {
      if (platform.type === 'moving') {
        // Move platform by directly updating position
        platform.x += platform.moveSpeed * platform.moveDirection;
        
        // Check if platform has moved too far from start position horizontally
        const distanceFromStart = Math.abs(platform.x - platform.startX);
        if (distanceFromStart > platform.moveRange) {
          // Reverse direction
          platform.moveDirection *= -1;
        }
        
        // Keep vertical position fixed
        platform.y = platform.startY || platform.y;
        
        // Debug: log platform movement
        if (this.debugText) {
          this.debugText.setText('Platform: x=' + Math.round(platform.x) + ', dir=' + platform.moveDirection + ', dist=' + Math.round(distanceFromStart));
        }
      }
    });
  }

  handlePlatformCollision(player, platform) {
    if (platform.type === 'breakable') {
      // Breakable platform disappears when player touches it
      platform.health--;
      if (platform.health <= 0) {
        // Add breaking effect
        platform.setTint(0xff0000);
        this.tweens.add({
          targets: platform,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            platform.destroy();
          }
        });
      }
    }
  }

  isOnMovingPlatform() {
    // Check if player is on a moving platform
    return this.movingPlatforms.children.entries.some(platform => {
      if (platform.type === 'moving') {
        // Check if player is touching the platform from above
        const playerBottom = this.player.y + this.player.height / 2;
        const platformTop = platform.y - platform.height / 2;
        const playerLeft = this.player.x - this.player.width / 2;
        const playerRight = this.player.x + this.player.width / 2;
        const platformLeft = platform.x - platform.width / 2;
        const platformRight = platform.x + platform.width / 2;
        
        // Player is on platform if their bottom is at platform top level
        // and they're horizontally overlapping
        return Math.abs(playerBottom - platformTop) < 10 && 
               playerRight > platformLeft && 
               playerLeft < platformRight;
      }
      return false;
    });
  }

  createBossAttack(boss, player) {
    // Different attack patterns based on boss health and phase
    const healthPercentage = boss.health / boss.maxHealth;
    
    if (healthPercentage <= 0.3) {
      // Critical health - rapid fire spread
      this.createBossSpreadAttack(boss, player);
    } else if (healthPercentage <= 0.6) {
      // Damaged - triple shot
      this.createBossTripleAttack(boss, player);
    } else {
      // Full health - single powerful shot
      this.createBossSingleAttack(boss, player);
    }
  }

  createBossSingleAttack(boss, player) {
    // Single powerful shot
    const bullet = this.add.rectangle(
      boss.x + (boss.facing === 'right' ? 40 : -40),
      boss.y,
      20,
      12,
      0xff0000
    );
    
    const bulletData = {
      sprite: bullet,
      velocityX: boss.facing === 'right' ? 10 : -10,
      velocityY: 0,
      lifetime: 240,
      isEnemyBullet: true
    };
    
    boss.bullets.push(bulletData);
  }

  createBossTripleAttack(boss, player) {
    // Triple shot spread
    const angles = [-15, 0, 15]; // Degrees
    const speed = 8;
    
    angles.forEach(angle => {
      const bullet = this.add.rectangle(
        boss.x + (boss.facing === 'right' ? 40 : -40),
        boss.y,
        16,
        10,
        0xff4400
      );
      
      const radians = Phaser.Math.DegToRad(angle);
      const velocityX = Math.cos(radians) * speed * (boss.facing === 'right' ? 1 : -1);
      const velocityY = Math.sin(radians) * speed;
      
      const bulletData = {
        sprite: bullet,
        velocityX: velocityX,
        velocityY: velocityY,
        lifetime: 200,
        isEnemyBullet: true
      };
      
      boss.bullets.push(bulletData);
    });
  }

  createBossSpreadAttack(boss, player) {
    // Rapid fire spread attack
    const angles = [-30, -15, 0, 15, 30]; // 5 bullets in spread
    const speed = 6;
    
    angles.forEach(angle => {
      const bullet = this.add.rectangle(
        boss.x + (boss.facing === 'right' ? 40 : -40),
        boss.y,
        14,
        8,
        0xff2200
      );
      
      const radians = Phaser.Math.DegToRad(angle);
      const velocityX = Math.cos(radians) * speed * (boss.facing === 'right' ? 1 : -1);
      const velocityY = Math.sin(radians) * speed;
      
      const bulletData = {
        sprite: bullet,
        velocityX: velocityX,
        velocityY: velocityY,
        lifetime: 180,
        isEnemyBullet: true
      };
      
      boss.bullets.push(bulletData);
    });
  }`;

    // Add shooting methods if shooting ability is enabled
    if (this.scheme.playerAbilities.includes('shoot')) {
      code += `

  createBullet() {
    // Create a simple rectangle bullet
    const bullet = this.add.rectangle(
      this.player.x + (this.playerState.facing === 'right' ? 30 : -30),
      this.player.y,
      16,
      8,
      0xffff00
    );
    
    // Store bullet data
    const bulletData = {
      sprite: bullet,
      velocityX: this.playerState.facing === 'right' ? 8 : -8, // pixels per frame
      velocityY: 0,
      lifetime: 180 // 3 seconds at 60fps
    };
    
    this.bullets.push(bulletData);
  }

  updateBullets() {
    // Update each bullet manually
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      // Move bullet
      bullet.sprite.x += bullet.velocityX;
      bullet.sprite.y += bullet.velocityY;
      
      // Check collision with platforms
      let hitPlatform = false;
      this.platforms.children.entries.forEach(platform => {
        if (this.checkCollision(bullet.sprite, platform)) {
          hitPlatform = true;
        }
      });
      
      // Check collision with enemies
      let hitEnemy = false;
      this.enemies.forEach(enemy => {
        if (this.checkCollision(bullet.sprite, enemy)) {
          hitEnemy = true;
          // Handle enemy health if they have it
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
            // Instant kill for enemies without health
            enemy.destroy();
            const index = this.enemies.indexOf(enemy);
            if (index > -1) {
              this.enemies.splice(index, 1);
            }
          }
        }
      });
      
      // Decrease lifetime
      bullet.lifetime--;
      
      // Remove bullet if it hit something or expired
      if (hitPlatform || hitEnemy || bullet.lifetime <= 0 || 
          bullet.sprite.x < 0 || bullet.sprite.x > 800) {
        bullet.sprite.destroy();
        this.bullets.splice(i, 1);
      }
    }
  }

  checkCollision(rect1, rect2) {
    return (rect1.x - rect1.width/2 < rect2.x + rect2.width/2 &&
            rect1.x + rect1.width/2 > rect2.x - rect2.width/2 &&
            rect1.y - rect1.height/2 < rect2.y + rect2.height/2 &&
            rect1.y + rect1.height/2 > rect2.y - rect2.height/2);
  }

  createPlayerProjectile() {
    const projectile = this.add.rectangle(this.player.x, this.player.y, 8, 8, 0xffff00);
    this.physics.add.existing(projectile, false);
    // Disable gravity for manually created projectiles too
    projectile.body.setAllowGravity(false);
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
    const projectile = this.add.rectangle(enemy.x, enemy.y, 8, 8, 0xff0000);
    this.physics.add.existing(projectile, false);
    projectile.body.setAllowGravity(false);
    projectile.body.setGravity(0, 0);
    
    // Calculate direction to player
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, target.x, target.y);
    const velocity = this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), 150);
    projectile.body.setVelocity(velocity.x, velocity.y);
    
    // Add to projectiles group if it exists
    if (this.projectiles) {
      this.projectiles.add(projectile);
    }
    
    // Destroy after 3 seconds
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

    return code;
  }

  private generateMovementCode(): string {
    const hasDoubleJump = this.scheme.playerAbilities.includes('doubleJump');
    const hasDash = this.scheme.playerAbilities.includes('dash');
    const hasWallJump = this.scheme.playerAbilities.includes('wallJump');
    const hasShoot = this.scheme.playerAbilities.includes('shoot');
    let code = `
    const speed = 200;
    const jumpSpeed = -400;
    
    // Reset velocity
    this.player.body.setVelocityX(0);
    
    // Get input state
    const left = this.cursors.left.isDown || this.wasd.a.isDown;
    const right = this.cursors.right.isDown || this.wasd.d.isDown;
    const shoot = this.cursors.shift.isDown || this.wasd.x.isDown;
    
    // Move left/right
    if (left) {
      this.player.body.setVelocityX(-speed);
      this.playerState.facing = 'left';
    } else if (right) {
      this.player.body.setVelocityX(speed);
      this.playerState.facing = 'right';
    }
    `;
    // Modular double jump logic
    if (hasDoubleJump) {
      code += ABILITY_CODE_SNIPPETS.doubleJump.replace(/-400/g, 'jumpSpeed');
    } else {
      // Normal jump logic
      code += `
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.w);
    if (jumpPressed && (this.player.body.blocked.down || this.isOnMovingPlatform())) {
      this.player.body.setVelocityY(jumpSpeed);
    }
      `;
    }
    // Modular wall jump logic
    if (hasWallJump) {
      code += ABILITY_CODE_SNIPPETS.wallJump
        .replace(/-350/g, 'jumpSpeed')
        .replace(/200/g, 'speed');
    }
    // Modular dash logic
    if (hasDash) {
      code += ABILITY_CODE_SNIPPETS.dash;
    }
    // Modular shooting logic
    if (hasShoot) {
      code += ABILITY_CODE_SNIPPETS.shoot;
    }
    return code;
  }

  private generateAbilityCode(): string {
    const hasShoot = this.scheme.playerAbilities.includes('shoot');
    let code = '';
    
    if (hasShoot) {
      code += `
    // Create bullet array to track bullets manually
    this.bullets = [];`;
    }
    
    return code;
  }
}