// Add these imports at the top
import { GameSchemeProcessor } from './gameSchemeProcessor';
import { GameSchema } from '../types/gameSchema';

// Add these functions to your existing file
export function createGameFromSchema(schema: GameSchema): {
  config: GameConfig;
  code: string;
} {
  const processor = new GameSchemeProcessor(schema);
  return {
    config: processor.toGameConfig(),
    code: processor.generatePhaserCode()
  };
}

export function createDynamicGameFromSchema(
  parentElement: HTMLElement,
  schema: GameSchema,
  Phaser: any
): Phaser.Game {
  const { config, code } = createGameFromSchema(schema);
  return createDynamicGame(parentElement, code, config, Phaser);
}

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
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Default boilerplate code for users to edit
export const DEFAULT_SCENE_BOILERPLATE = `// Edit the create() and update() methods below
// You have access to 'this' which is your Phaser.Scene instance

create() {
  // Create a player rectangle
  this.player = this.add.rectangle(100, 100, 32, 32, 0x00ff00);
  this.physics.add.existing(this.player, false);
  this.player.body.setCollideWorldBounds(true);
  this.player.body.setBounce(0.3, 0.3);
  
  // Create a static group for platforms and walls
  this.platforms = this.physics.add.staticGroup();

  // Create a platform
  const platform = this.add.rectangle(400, 500, 200, 20, 0xff0000);
  this.physics.add.existing(platform, true);
  this.platforms.add(platform);

  // Create left and right walls (inside the visible area)
  const leftWall = this.add.rectangle(10, 300, 20, 600, 0x888888);
  this.physics.add.existing(leftWall, true);
  this.platforms.add(leftWall);
  const rightWall = this.add.rectangle(790, 300, 20, 600, 0x888888);
  this.physics.add.existing(rightWall, true);
  this.platforms.add(rightWall);

  // Add collision between player and platforms (including walls)
  this.physics.add.collider(this.player, this.platforms);
  
  // Setup keyboard controls
  this.cursors = this.input.keyboard.createCursorKeys();
  this.wasd = this.input.keyboard.addKeys({
    a: Phaser.Input.Keyboard.KeyCodes.A,
    d: Phaser.Input.Keyboard.KeyCodes.D,
    w: Phaser.Input.Keyboard.KeyCodes.W
  });
  
  // Add debug text
  this.debugText = this.add.text(10, 10, 'Game Ready!', { 
    color: '#ffffff', 
    fontSize: '16px',
    fontFamily: 'monospace'
  });
  
  // Focus the canvas for input
  this.sys.game.canvas.setAttribute('tabindex', '0');
  this.sys.game.canvas.focus();
}

update() {
  // Handle player movement
  const speed = 200;
  const jumpSpeed = -400;
  
  // Reset velocity
  this.player.body.setVelocityX(0);
  
  // Get input state
  const left = this.cursors.left.isDown || this.wasd.a.isDown;
  const right = this.cursors.right.isDown || this.wasd.d.isDown;
  const jump = this.cursors.up.isDown || this.wasd.w.isDown;
  
  // Move left/right
  if (left) {
    this.player.body.setVelocityX(-speed);
  } else if (right) {
    this.player.body.setVelocityX(speed);
  }
  
  // Jump (only if on ground)
  if (jump && this.player.body.blocked.down) {
    this.player.body.setVelocityY(jumpSpeed);
  }
  
  // Update debug text
  const debugInfo = 'Left: ' + left + ' | Right: ' + right + ' | Jump: ' + jump + '\n' +
                   'On Ground: ' + this.player.body.blocked.down + '\n' +
                   'Velocity: (' + Math.round(this.player.body.velocity.x) + ', ' + Math.round(this.player.body.velocity.y) + ')';
  this.debugText.setText(debugInfo);
}`;

// Advanced example showing complete class structure
export const ADVANCED_SCENE_EXAMPLE = `// Complete Scene class example
// You can write the entire class if you want full control

class DynamicScene extends Phaser.Scene {
  constructor() {
    super({ key: "DynamicScene" });
  }

  preload() {
    // Load assets here
    // this.load.image('player', 'player.png');
  }

  create() {
    // Create a player rectangle
    this.player = this.add.rectangle(100, 100, 32, 32, 0x00ff00);
    this.physics.add.existing(this.player, false);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setBounce(0.3, 0.3);
    
    // Create multiple platforms
    this.platforms = this.physics.add.staticGroup();
    
    const platform1 = this.add.rectangle(400, 500, 200, 20, 0xff0000);
    this.physics.add.existing(platform1, true);
    this.platforms.add(platform1);
    
    const platform2 = this.add.rectangle(600, 400, 150, 20, 0x0000ff);
    this.physics.add.existing(platform2, true);
    this.platforms.add(platform2);
    
    // Add collision between player and platforms
    this.physics.add.collider(this.player, this.platforms);
    
    // Setup keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W
    });
    
    // Add debug text
    this.debugText = this.add.text(10, 10, '', { 
      color: '#ffffff', 
      fontSize: '16px',
      fontFamily: 'monospace'
    });
    
    // Focus the canvas for input
    this.sys.game.canvas.setAttribute('tabindex', '0');
    this.sys.game.canvas.focus();
  }

  update() {
    // Handle player movement
    const speed = 200;
    const jumpSpeed = -400;
    
    // Reset velocity
    this.player.body.setVelocityX(0);
    
    // Get input state
    const left = this.cursors.left.isDown || this.wasd.a.isDown;
    const right = this.cursors.right.isDown || this.wasd.d.isDown;
    const jump = this.cursors.up.isDown || this.wasd.w.isDown;
    
    // Move left/right
    if (left) {
      this.player.body.setVelocityX(-speed);
    } else if (right) {
      this.player.body.setVelocityX(speed);
    }
    
    // Jump (only if on ground)
    if (jump && this.player.body.blocked.down) {
      this.player.body.setVelocityY(jumpSpeed);
    }
    
    // Update debug text
    this.debugText.setText(
      'Left: ' + left + ' | Right: ' + right + ' | Jump: ' + jump + '\n' +
      'On Ground: ' + this.player.body.blocked.down + '\n' +
      'Velocity: (' + Math.round(this.player.body.velocity.x) + ', ' + Math.round(this.player.body.velocity.y) + ')'
    );
  }
}`;

// Configuration for the game
export const GAME_CONFIG: GameConfig = {
  backgroundColor: "#1e1e2f",
  gravity: { x: 0, y: 600 },
  player: {
    x: 100,
    y: 100,
    size: 30,
    color: 0x00ffcc,
    bounce: 0.3,
  },
  platforms: [
    { x: 200, y: 500, width: 400, height: 40, color: 0xff0000 },
    { x: 600, y: 400, width: 200, height: 30, color: 0x00ff00 },
    { x: 400, y: 300, width: 300, height: 20, color: 0x0000ff },
    { x: 100, y: 200, width: 250, height: 20, color: 0xffff00 },
  ],
  controls: {
    left: "LEFT",
    right: "RIGHT",
    jump: "SPACE",
  }
};

// Safe wrapper to create a Scene class from user code
export function wrapUserCode(userCode: string): string {
  // Check if user provided a complete class or just methods
  const hasClassDeclaration = userCode.includes('class') && userCode.includes('extends');
  
  if (hasClassDeclaration) {
    // User provided a complete class - validate and return
    return validateAndWrapClass(userCode);
  } else {
    // User provided just methods - wrap them in a class
    return wrapMethodsInClass(userCode);
  }
}

function validateAndWrapClass(userCode: string): string {
  // Basic validation - ensure it extends Phaser.Scene
  if (!userCode.includes('extends Phaser.Scene')) {
    throw new Error('Class must extend Phaser.Scene');
  }
  
  // Ensure it has a constructor or we'll add one
  if (!userCode.includes('constructor(')) {
    const constructorInsertion = userCode.indexOf('{') + 1;
    userCode = userCode.slice(0, constructorInsertion) + 
               '\n    super({ key: "DynamicScene" });\n  ' + 
               userCode.slice(constructorInsertion);
  }
  
  return userCode;
}

function wrapMethodsInClass(userCode: string): string {
  return `class DynamicScene extends Phaser.Scene {
  constructor() {
    super({ key: "DynamicScene" });
  }

  ${userCode}
}`;
}

// Create a Phaser game config with the dynamic scene
export function createGameConfig(
  parentElement: HTMLElement, 
  sceneClass: any, 
  config: GameConfig = GAME_CONFIG,
  width?: number,
  height?: number
): Phaser.Types.Core.GameConfig {
  // Get the actual container size
  const containerRect = parentElement.getBoundingClientRect();
  const gameWidth = width || containerRect.width || 800;
  const gameHeight = height || containerRect.height || 600;
  
  return {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    backgroundColor: config.backgroundColor,
    parent: parentElement,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: gameWidth,
      height: gameHeight
    },
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
      gamepad: false
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: config.gravity,
        debug: true
      }
    },
    scene: sceneClass
  };
}

// Compile user code into a Scene class
export function compileSceneClass(userCode: string, Phaser: any): any {
  try {
    console.log('[compileSceneClass] Starting compilation...');
    console.log('[compileSceneClass] User code length:', userCode.length);
    console.log('[compileSceneClass] Phaser available:', typeof Phaser);
    
    // Wrap the user code in a proper class structure
    const wrappedCode = wrapUserCode(userCode);
    console.log('[compileSceneClass] Wrapped code length:', wrappedCode.length);
    
    // Create the class using new Function with Phaser available
    const functionBody = `
      ${wrappedCode}
      return DynamicScene;
    `;
    
    console.log('[compileSceneClass] Function body length:', functionBody.length);
    
    const SceneClass = new Function('Phaser', functionBody)(Phaser);
    
    console.log('[compileSceneClass] Scene class created successfully:', typeof SceneClass);
    
    return SceneClass;
  } catch (error) {
    console.error('[compileSceneClass] Error compiling scene class:', error);
    console.error('[compileSceneClass] User code that failed:', userCode);
    console.error('[compileSceneClass] Phaser type:', typeof Phaser);
    throw new Error(`Compilation error: ${error.message}`);
  }
}

// Legacy function for backward compatibility
export function generatePhaserCode(config: GameConfig = GAME_CONFIG): string {
  return DEFAULT_SCENE_BOILERPLATE;
}

// Helper function to create a complete game with the dynamic scene
export function createDynamicGame(
  parentElement: HTMLElement, 
  userCode: string, 
  config: GameConfig = GAME_CONFIG,
  Phaser: any,
  width?: number,
  height?: number
): Phaser.Game {
  try {
    // Compile the user code into a Scene class
    const SceneClass = compileSceneClass(userCode, Phaser);
    
    // Create game config with the dynamic scene and proper sizing
    const gameConfig = createGameConfig(parentElement, SceneClass, config, width, height);
    
    // Create and return the game
    return new Phaser.Game(gameConfig);
  } catch (error) {
    console.error('Error creating dynamic game:', error);
    throw error;
  }
}

// Error handling utilities
export function validateUserCode(userCode: string): ValidationResult {
  const errors: string[] = [];
  
  try {
    // Check if user provided a complete class or just methods
    const hasClassDeclaration = userCode.includes('class') && userCode.includes('extends');
    
    let codeToValidate = userCode;
    
    if (!hasClassDeclaration) {
      // Wrap method-only code in a class for validation
      codeToValidate = wrapMethodsInClass(userCode);
    }
    
    // Basic syntax check with the wrapped code
    new Function(codeToValidate);
  } catch (error) {
    errors.push(`Syntax error: ${error.message}`);
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    'eval(',
    'Function(',
    'setTimeout(',
    'setInterval(',
    'fetch(',
    'XMLHttpRequest',
    'localStorage',
    'sessionStorage',
    'document.cookie'
  ];
  
  dangerousPatterns.forEach(pattern => {
    if (userCode.includes(pattern)) {
      errors.push(`Potentially unsafe code detected: ${pattern}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}