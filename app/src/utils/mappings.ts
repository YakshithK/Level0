export const ABILITY_CODE_SNIPPETS = {
    dash: `
  // --- DASH LOGIC START ---
  const dashSpeed = 400;
  const dashDuration = 10;

  // Dash cooldown logic
  if (this.playerState.dashCooldown > 0) {
    this.playerState.dashCooldown--;
  }

  // Dash trigger
  if (
    Phaser.Input.Keyboard.JustDown(this.cursors.shift) &&
    this.playerState.dashCooldown === 0 &&
    !this.playerState.dashing
  ) {
    this.playerState.dashing = true;
    this.playerState.dashTime = dashDuration;
    this.playerState.dashDirection =
      (this.cursors.left.isDown || this.wasd.a.isDown) ? -1 :
      (this.cursors.right.isDown || this.wasd.d.isDown) ? 1 : 1; // default right
    this.playerState.dashCooldown = 30;
  }

  // Handle dashing
  if (this.playerState.dashing) {
    this.player.body.setVelocityX(this.playerState.dashDirection * dashSpeed);
    this.playerState.dashTime--;
    if (this.playerState.dashTime <= 0) {
      this.playerState.dashing = false;
    }
    // Prevent normal movement while dashing
    return;
  }
  // --- DASH LOGIC END ---
`,
    doubleJump: `
  // --- DOUBLE JUMP LOGIC START ---
  if (this.player.body.blocked.down) {
    this.playerState.hasDoubleJumped = false;
  }
  const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.w);
  if (jumpPressed) {
    if (this.player.body.blocked.down) {
      this.player.body.setVelocityY(-400);
    } else if (!this.playerState.hasDoubleJumped) {
      this.player.body.setVelocityY(-400);
      this.playerState.hasDoubleJumped = true;
    }
  }
  // --- DOUBLE JUMP LOGIC END ---
`,
    wallJump: `
  // --- WALL JUMP LOGIC START ---
  this.playerState.isOnWall = this.player.body.blocked.left || this.player.body.blocked.right;
  if (this.playerState.wallJumpCooldown > 0) {
    this.playerState.wallJumpCooldown--;
  }
  if (
    Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.w)
  ) {
    if (
      this.playerState.isOnWall &&
      !this.player.body.blocked.down &&
      this.playerState.wallJumpCooldown === 0
    ) {
      const wallJumpX = this.player.body.blocked.left ? speed : -speed;
      this.player.body.setVelocity(wallJumpX, jumpSpeed);
      this.playerState.wallJumpCooldown = 10;
    }
  }
  // --- WALL JUMP LOGIC END ---
`,
    shoot: `
  // --- SHOOTING LOGIC START ---
  if (this.playerState.shootCooldown > 0) {
    this.playerState.shootCooldown--;
  }
  const shootPressed = this.cursors.space.isDown || this.wasd.x.isDown;
  if (shootPressed && this.playerState.shootCooldown === 0) {
    this.createBullet();
    this.playerState.shootCooldown = 10; // Reduced cooldown for continuous shooting
  }
  
  // Update bullets manually
  this.updateBullets();
  // --- SHOOTING LOGIC END ---
`,
    // ...other abilities
  };

export const ENEMY_CODE_SNIPPETS = {
  patrol: {
    create: (index: number, x: number, y: number, color: number) => `
    const patrol${index} = this.add.rectangle(${x}, ${y}, 20, 20, ${color});
    this.physics.add.existing(patrol${index}, true);
    patrol${index}.body.setImmovable(true);
    patrol${index}.body.setVelocityX(100);
    patrol${index}.body.setBounceX(1);
    patrol${index}.patrolDirection = 1;
    this.enemies.push(patrol${index});`,
    update: (index: number) => `
    // Update patrol enemy ${index}
    const patrol${index} = this.enemies[${index}];
    if (patrol${index} && patrol${index}.body) {
      if (patrol${index}.body.blocked.left || patrol${index}.body.blocked.right) {
        patrol${index}.body.setVelocityX(-patrol${index}.body.velocity.x);
      }
    }`
  },
  shooter: {
    create: (index: number, x: number, y: number, color: number) => `
    const shooter${index} = this.add.rectangle(${x}, ${y}, 32, 32, 0xffffff);
    this.physics.add.existing(shooter${index}, true);
    shooter${index}.shootTimer = 0;
    shooter${index}.bullets = [];
    shooter${index}.facing = 'right';
    shooter${index}.health = 3;
    shooter${index}.setAlpha(1.0); // Start fully opaque
    this.enemies.push(shooter${index});`,
    update: (index: number) => `
    // Update shooter enemy ${index}
    const shooter${index} = this.enemies[${index}];
    if (shooter${index} && this.player) {
      shooter${index}.shootTimer++;
      
      // Update transparency based on health
      if (shooter${index}.health === 3) {
        shooter${index}.setAlpha(1.0); // Fully opaque
      } else if (shooter${index}.health === 2) {
        shooter${index}.setAlpha(0.6); // 60% opacity
      } else if (shooter${index}.health === 1) {
        shooter${index}.setAlpha(0.3); // 30% opacity
      }
      
      // Face the player
      if (this.player.x > shooter${index}.x) {
        shooter${index}.facing = 'right';
        shooter${index}.scaleX = 1;
      } else {
        shooter${index}.facing = 'left';
        shooter${index}.scaleX = -1;
      }
      
      // Shoot every 1 second (60 frames at 60fps) - increased firing rate
      if (shooter${index}.shootTimer > 60) {
        // Create bullet using same logic as player
        const bullet = this.add.rectangle(
          shooter${index}.x + (shooter${index}.facing === 'right' ? 30 : -30),
          shooter${index}.y,
          16,
          8,
          0xff0000
        );
        
        // Store bullet data
        const bulletData = {
          sprite: bullet,
          velocityX: shooter${index}.facing === 'right' ? 8 : -8,
          velocityY: 0,
          lifetime: 180,
          isEnemyBullet: true
        };
        
        shooter${index}.bullets.push(bulletData);
        shooter${index}.shootTimer = 0;
      }
      
      // Update bullets
      for (let i = shooter${index}.bullets.length - 1; i >= 0; i--) {
        const bullet = shooter${index}.bullets[i];
        
        // Move bullet
        bullet.sprite.x += bullet.velocityX;
        bullet.sprite.y += bullet.velocityY;
        
        // Check collision with player
        if (this.player && this.checkCollision(bullet.sprite, this.player)) {
          // Handle player hit
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
          
          bullet.sprite.destroy();
          shooter${index}.bullets.splice(i, 1);
          continue;
        }
        
        // Check collision with platforms
        let hitPlatform = false;
        this.platforms.children.entries.forEach(platform => {
          if (this.checkCollision(bullet.sprite, platform)) {
            hitPlatform = true;
          }
        });
        
        // Decrease lifetime
        bullet.lifetime--;
        
        // Remove bullet if it hit something or expired
        if (hitPlatform || bullet.lifetime <= 0 || 
            bullet.sprite.x < 0 || bullet.sprite.x > 800) {
          bullet.sprite.destroy();
          shooter${index}.bullets.splice(i, 1);
        }
      }
    }`
  },
  boss: {
    create: (index: number, x: number, y: number, color: number) => `
    const boss${index} = this.add.rectangle(${x}, ${y}, 60, 60, 0xff6600);
    this.physics.add.existing(boss${index}, false);
    boss${index}.body.setBounce(0.3, 0.3);
    boss${index}.body.setCollideWorldBounds(true);
    boss${index}.health = 10;
    boss${index}.maxHealth = 10;
    boss${index}.attackTimer = 0;
    boss${index}.attackPhase = 0;
    boss${index}.bullets = [];
    boss${index}.facing = 'right';
    boss${index}.moveTimer = 0;
    boss${index}.patrolDirection = 1;
    boss${index}.setAlpha(1.0);
    this.enemies.push(boss${index});`,
    update: (index: number) => `
    // Update boss enemy ${index}
    const boss${index} = this.enemies[${index}];
    if (boss${index} && this.player) {
      boss${index}.attackTimer++;
      boss${index}.moveTimer++;
      
      // Update transparency based on health
      const healthPercentage = boss${index}.health / boss${index}.maxHealth;
      if (healthPercentage > 0.7) {
        boss${index}.setAlpha(1.0); // Full health - fully opaque
      } else if (healthPercentage > 0.4) {
        boss${index}.setAlpha(0.8); // Damaged - 80% opacity
      } else if (healthPercentage > 0.2) {
        boss${index}.setAlpha(0.6); // Heavily damaged - 60% opacity
      } else {
        boss${index}.setAlpha(0.4); // Critical - 40% opacity
      }
      
      // Face the player
      if (this.player.x > boss${index}.x) {
        boss${index}.facing = 'right';
        boss${index}.scaleX = 1;
      } else {
        boss${index}.facing = 'left';
        boss${index}.scaleX = -1;
      }
      
      // Movement logic
      const distanceToPlayer = Math.abs(boss${index}.x - this.player.x);
      
      if (distanceToPlayer < 300) {
        // Chase player when close
        const chaseSpeed = 100;
        if (this.player.x > boss${index}.x) {
          boss${index}.body.setVelocityX(chaseSpeed);
        } else {
          boss${index}.body.setVelocityX(-chaseSpeed);
        }
      } else {
        // Patrol when player is far
        if (boss${index}.moveTimer > 120) { // Change direction every 2 seconds
          boss${index}.patrolDirection *= -1;
          boss${index}.moveTimer = 0;
        }
        boss${index}.body.setVelocityX(boss${index}.patrolDirection * 80);
      }
      
      // Different attack patterns based on health
      let attackInterval = 120; // Default: attack every 2 seconds
      
      if (boss${index}.health <= 3) {
        // Critical health - very aggressive
        attackInterval = 40; // Attack every 0.67 seconds
        boss${index}.attackPhase = 2;
      } else if (boss${index}.health <= 6) {
        // Damaged - more aggressive
        attackInterval = 80; // Attack every 1.33 seconds
        boss${index}.attackPhase = 1;
      }
      
      // Attack based on timer
      if (boss${index}.attackTimer > attackInterval) {
        this.createBossAttack(boss${index}, this.player);
        boss${index}.attackTimer = 0;
      }
      
      // Update boss bullets
      for (let i = boss${index}.bullets.length - 1; i >= 0; i--) {
        const bullet = boss${index}.bullets[i];
        
        // Move bullet
        bullet.sprite.x += bullet.velocityX;
        bullet.sprite.y += bullet.velocityY;
        
        // Check collision with player
        if (this.player && this.checkCollision(bullet.sprite, this.player)) {
          // Handle player hit
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
          
          bullet.sprite.destroy();
          boss${index}.bullets.splice(i, 1);
          continue;
        }
        
        // Check collision with platforms
        let hitPlatform = false;
        this.platforms.children.entries.forEach(platform => {
          if (this.checkCollision(bullet.sprite, platform)) {
            hitPlatform = true;
          }
        });
        
        // Decrease lifetime
        bullet.lifetime--;
        
        // Remove bullet if it hit something or expired
        if (hitPlatform || bullet.lifetime <= 0 || 
            bullet.sprite.x < 0 || bullet.sprite.x > 800) {
          bullet.sprite.destroy();
          boss${index}.bullets.splice(i, 1);
        }
      }
    }`
  },
  spike: {
    create: (index: number, x: number, y: number, color: number) => `
    const spike${index} = this.add.rectangle(${x}, ${y}, 20, 20, ${color});
    this.physics.add.existing(spike${index}, true);
    this.enemies.push(spike${index});`,
    update: (index: number) => `
    // Spike enemy ${index} - static, no update needed`
  },
  slime: {
    create: (index: number, x: number, y: number, color: number) => `
    const slime${index} = this.add.rectangle(${x}, ${y}, 20, 20, ${color});
    this.physics.add.existing(slime${index}, false);
    slime${index}.body.setBounce(1.0, 1.0);
    slime${index}.body.setVelocityX(80);
    slime${index}.body.setCollideWorldBounds(true);
    slime${index}.jumpTimer = 0;
    slime${index}.direction = 1;
    slime${index}.health = 1;
    this.enemies.push(slime${index});`,
    update: (index: number) => `
    // Update slime enemy ${index}
    const slime${index} = this.enemies[${index}];
    if (slime${index} && slime${index}.body) {
      slime${index}.jumpTimer++;
      
      // Bounce off walls and change direction
      if (slime${index}.body.blocked.left || slime${index}.body.blocked.right) {
        slime${index}.body.setVelocityX(-slime${index}.body.velocity.x);
        slime${index}.direction *= -1;
      }
      
      // Random jumping (more frequent and higher)
      if (slime${index}.jumpTimer > 60 && Math.random() < 0.3) { // Jump every 1-2 seconds
        slime${index}.body.setVelocityY(-250);
        slime${index}.jumpTimer = 0;
      }
      
      // Player tracking - move towards player if close
      if (this.player && slime${index}.body.blocked.down) {
        const distanceToPlayer = Math.abs(slime${index}.x - this.player.x);
        if (distanceToPlayer < 200) {
          const playerDirection = this.player.x > slime${index}.x ? 1 : -1;
          slime${index}.body.setVelocityX(playerDirection * 120);
          slime${index}.direction = playerDirection;
          
          // Jump at player when close (higher jump)
          if (distanceToPlayer < 100 && Math.random() < 0.1) {
            slime${index}.body.setVelocityY(-300);
          }
        }
      }
      
      // Random direction changes
      if (Math.random() < 0.005) { // 0.5% chance per frame
        slime${index}.body.setVelocityX(-slime${index}.body.velocity.x);
        slime${index}.direction *= -1;
      }
    }`
  }
};

export const HELPER_METHOD_SNIPPETS = {
  handleEnemyCollision: `
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
  }`,
  handleWin: `
  handleWin(player, portal) {
    // Handle win condition
    this.add.text(400, 300, 'YOU WIN!', { 
      fontSize: '32px', 
      color: '#00ff00' 
    }).setOrigin(0.5);
  }`,
  handlePlayerHitByProjectile: `
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
  }`,
  updatePlatforms: `
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
  }`,
  handlePlatformCollision: `
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
  }`,
  isOnMovingPlatform: `
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
  }`,
  createBossAttack: `
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
  }`,
  createBossSingleAttack: `
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
  }`,
  createBossTripleAttack: `
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
  }`,
  createBossSpreadAttack: `
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
  }`,
  createBullet: `
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
  }`,
  updateBullets: `
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
  }`,
  checkCollision: `
  checkCollision(rect1, rect2) {
    return (rect1.x - rect1.width/2 < rect2.x + rect2.width/2 &&
            rect1.x + rect1.width/2 > rect2.x - rect2.width/2 &&
            rect1.y - rect1.height/2 < rect2.y + rect2.height/2 &&
            rect1.y + rect1.height/2 > rect2.y - rect2.height/2);
  }`,
  createPlayerProjectile: `
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
  }`,
  createEnemyProjectile: `
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
  }`,
  handleProjectileHit: `
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
  }`,
  handleProjectileWall: `
  handleProjectileWall(projectile, wall) {
    projectile.destroy();
  }`,
};


// WORKING SCENE CLASS FOR SNAKE EATING APPLE GAME FROM CLAUDE SONNET 4
class DynamicScene extends Phaser.Scene {
  constructor() {
    super({ key: "SnakeGame" });
  }

  create() {
    // Game settings
    this.gridSize = 20;
    this.gameWidth = 800;
    this.gameHeight = 600;
    this.cols = this.gameWidth / this.gridSize;
    this.rows = this.gameHeight / this.gridSize;

    // Set background
    this.cameras.main.setBackgroundColor('#2d1b1b');

    // Initialize snake
    this.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];

    // Snake direction
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };

    // Game state
    this.score = 0;
    this.gameRunning = true;

    // Create apple
    this.apple = this.generateApple();

    // Create snake graphics
    this.snakeGraphics = [];
    this.updateSnakeGraphics();

    // Create apple graphic
    this.appleGraphic = this.add.rectangle(
      this.apple.x * this.gridSize + this.gridSize / 2,
      this.apple.y * this.gridSize + this.gridSize / 2,
      this.gridSize - 2,
      this.gridSize - 2,
      0xff0000
    );

    // Setup controls
    this.wasd = this.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Create UI
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#00ff00'
    });

    this.gameOverText = this.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2,
      '',
      {
        fontSize: '32px',
        color: '#ff0000'
      }
    ).setOrigin(0.5).setVisible(false);

    // Game loop timer
    this.gameTimer = this.time.addEvent({
      delay: 150,
      callback: this.updateGame,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    if (!this.gameRunning) return;

    // Handle input
    if (this.wasd.w.isDown && this.direction.y !== 1) {
      this.nextDirection = { x: 0, y: -1 };
    } else if (this.wasd.s.isDown && this.direction.y !== -1) {
      this.nextDirection = { x: 0, y: 1 };
    } else if (this.wasd.a.isDown && this.direction.x !== 1) {
      this.nextDirection = { x: -1, y: 0 };
    } else if (this.wasd.d.isDown && this.direction.x !== -1) {
      this.nextDirection = { x: 1, y: 0 };
    }
  }

  updateGame() {
    if (!this.gameRunning) return;

    // Update direction
    this.direction = { ...this.nextDirection };

    // Move snake
    const head = { ...this.snake[0] };
    head.x += this.direction.x;
    head.y += this.direction.y;

    // Check wall collision
    if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
      this.gameOver();
      return;
    }

    // Check self collision
    for (let segment of this.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        this.gameOver();
        return;
      }
    }

    // Add new head
    this.snake.unshift(head);

    // Check apple collision
    if (head.x === this.apple.x && head.y === this.apple.y) {
      this.eatApple();
    } else {
      // Remove tail if no apple eaten
      this.snake.pop();
    }

    // Update graphics
    this.updateSnakeGraphics();
  }

  generateApple() {
    let apple;
    do {
      apple = {
        x: Phaser.Math.Between(0, this.cols - 1),
        y: Phaser.Math.Between(0, this.rows - 1)
      };
    } while (this.isAppleOnSnake(apple));
    
    return apple;
  }

  isAppleOnSnake(apple) {
    return this.snake.some(segment => 
      segment.x === apple.x && segment.y === apple.y
    );
  }

  eatApple() {
    // Increase score
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);

    // Generate new apple
    this.apple = this.generateApple();
    
    // Update apple graphic position
    this.appleGraphic.x = this.apple.x * this.gridSize + this.gridSize / 2;
    this.appleGraphic.y = this.apple.y * this.gridSize + this.gridSize / 2;

    // Increase game speed slightly
    if (this.gameTimer.delay > 80) {
      this.gameTimer.delay = Math.max(80, this.gameTimer.delay - 2);
    }
  }

  updateSnakeGraphics() {
    // Clear existing snake graphics
    this.snakeGraphics.forEach(graphic => graphic.destroy());
    this.snakeGraphics = [];

    // Create new snake graphics
    this.snake.forEach((segment, index) => {
      const color = index === 0 ? 0x00ff00 : 0x00aa00; // Head is brighter
      const graphic = this.add.rectangle(
        segment.x * this.gridSize + this.gridSize / 2,
        segment.y * this.gridSize + this.gridSize / 2,
        this.gridSize - 2,
        this.gridSize - 2,
        color
      );
      this.snakeGraphics.push(graphic);
    });
  }

  gameOver() {
    this.gameRunning = false;
    this.gameTimer.destroy();

    this.gameOverText.setText(
      'GAME OVER!\nFinal Score: ' + this.score + '\nPress R to Restart'
    ).setVisible(true);

    // Add restart functionality
    this.input.keyboard.once('keydown-R', () => {
      this.scene.restart();
    });
  }
}

