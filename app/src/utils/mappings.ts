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
  const shootPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
  if (shootPressed && this.playerState.shootCooldown === 0) {
    this.createBullet();
    this.playerState.shootCooldown = 20; // 20 frames cooldown
  }
  
  // Update bullets manually
  this.updateBullets();
  // --- SHOOTING LOGIC END ---
`,
    // ...other abilities
  };