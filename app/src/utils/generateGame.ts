export function generatePhaserCode(config) {
    return `
  const config = {
    parent: gameRef,
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "${config.backgroundColor}",
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
      gamepad: false
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: ${config.gravity.y} },
        debug: true
      }
    },
    scene: {
      create() {
        // Player
        console.log(document.activeElement === this.sys.game.canvas);
        const player = this.add.rectangle(${config.player.x}, ${config.player.y}, ${config.player.size}, ${config.player.size}, ${config.player.color});
        this.physics.add.existing(player, false); // false = dynamic body
        player.body.setCollideWorldBounds(true);
        player.body.setBounce(${config.player.bounce}, ${config.player.bounce});
        this.player = player;
  
        // Platforms
        const platforms = this.physics.add.staticGroup();
  ${config.platforms.map(
    p => `      { const plat = this.add.rectangle(${p.x}, ${p.y}, ${p.width}, ${p.height}, ${p.color}); this.physics.add.existing(plat, true); platforms.add(plat); }`
  ).join('\n')}
        this.physics.add.collider(this.player, platforms);
  
        // Controls: support both arrows and WASD
        this.input.keyboard.enabled = true;
        this.cursors = this.input.keyboard.addKeys({
          left: Phaser.Input.Keyboard.KeyCodes.LEFT,
          right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
          up: Phaser.Input.Keyboard.KeyCodes.UP,
          space: Phaser.Input.Keyboard.KeyCodes.SPACE,
          a: Phaser.Input.Keyboard.KeyCodes.A,
          d: Phaser.Input.Keyboard.KeyCodes.D,
          w: Phaser.Input.Keyboard.KeyCodes.W
        });
        this.arrows = this.input.keyboard.createCursorKeys();
  
        // Debug text
        this.debugText = this.add.text(10, 10, '', { color: '#fff', fontSize: '16px' });
  
        // Aggressive focus and debug
        setTimeout(() => {
          const canvas = this.sys.game.canvas;
          if (canvas) {
            canvas.setAttribute('tabindex', '0');
            canvas.focus();
            console.log('[PHASER] canvas.focus() called in create()');
            canvas.addEventListener('pointerdown', () => {
              canvas.focus();
              console.log('[PHASER] canvas.focus() called on pointerdown');
            });
          }
          if (gameRef) {
            gameRef.addEventListener('click', () => {
              if (canvas) {
                canvas.focus();
                console.log('[PHASER] canvas.focus() called from gameRef click');
              }
            });
          }
          window.focus();
        }, 100);
  
        // Global keydown debug
        window.addEventListener('keydown', function(e) {
          console.log('[GLOBAL] keydown:', e.code, e.key, e.keyCode);
        });
      },
      update() {
        // Force focus every frame and log active element
        if (this.sys && this.sys.game && this.sys.game.canvas) {
          if (document.activeElement !== this.sys.game.canvas) {
            console.log('[PHASER] Active element is not Phaser canvas:', document.activeElement);
          } else {
            console.log('[PHASER] Active element IS Phaser canvas');
          }
        }
        window.focus();
  
        const speed = 200;
        const jumpSpeed = -400;
        this.player.body.setVelocity(0);
  
        // Move left/right
        let left = this.cursors.left.isDown || this.cursors.a.isDown || (this.arrows && this.arrows.left.isDown);
        let right = this.cursors.right.isDown || this.cursors.d.isDown || (this.arrows && this.arrows.right.isDown);
        let jump = this.cursors.space.isDown || this.cursors.w.isDown || this.cursors.up.isDown || (this.arrows && this.arrows.up.isDown);
        this.debugText.setText('Left: ' + left + ' | Right: ' + right + ' | Jump: ' + jump + ' | Blocked.down: ' + this.player.body.blocked.down);
  
        if (left) {
          this.player.body.setVelocityX(-speed);
        } else if (right) {
          this.player.body.setVelocityX(speed);
        }
  
        // Jump (only if on ground)
        if (jump && this.player.body.blocked.down) {
          this.player.body.setVelocityY(jumpSpeed);
        }
      }
    }
  };
  window.__phaserGame = new Phaser.Game(config);
  `.trim();
  }