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