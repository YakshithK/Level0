# Phaser Live Code Editor

A React application that allows users to edit Phaser game scenes in real-time using a Monaco editor, with proper Scene class-based architecture and hot-swapping capabilities.

## Architecture Overview

This application uses a **Scene class-based architecture** that allows users to edit only the game logic (create/update methods) while maintaining proper Phaser behavior like input tracking, focus management, and Scene lifecycle.

### Key Features

- **Safe Dynamic Compilation**: User code is wrapped in proper Phaser.Scene classes using `new Function()`
- **Live Hot-Swapping**: Games are recreated with new scenes when code changes
- **Error Handling**: Comprehensive validation and error display
- **Multiple Templates**: Basic and advanced examples provided
- **TypeScript Support**: Full type safety with interfaces

## How It Works

### 1. Code Wrapping

User code is automatically wrapped into a proper Phaser.Scene class:

```javascript
// User writes just methods:
create() {
  this.player = this.add.rectangle(100, 100, 32, 32, 0x00ff00);
}

update() {
  // movement logic
}

// Gets wrapped into:
class DynamicScene extends Phaser.Scene {
  constructor() {
    super({ key: "DynamicScene" });
  }
  
  create() {
    this.player = this.add.rectangle(100, 100, 32, 32, 0x00ff00);
  }
  
  update() {
    // movement logic
  }
}
```

### 2. Dynamic Compilation

The wrapped code is compiled using `new Function()` with Phaser available:

```javascript
const SceneClass = new Function('Phaser', `
  ${wrappedCode}
  return DynamicScene;
`)(Phaser);
```

### 3. Game Recreation

When code changes, the entire game is destroyed and recreated with the new scene:

```javascript
// Destroy old game
if (gameInstance.current) {
  gameInstance.current.destroy(true);
}

// Create new game with compiled scene
gameInstance.current = createDynamicGame(parentElement, userCode, config);
```

## File Structure

```
src/
├── components/
│   └── PhaserGames.tsx      # Main game component with hot-swapping
├── pages/
│   └── Chat.tsx             # UI with Monaco editor and game preview
└── utils/
    └── generateGame.ts      # Core utilities for dynamic compilation
```

## Key Functions

### `wrapUserCode(userCode: string): string`
Wraps user code into a proper Scene class. Handles both method-only and complete class inputs.

### `compileSceneClass(userCode: string): any`
Compiles user code into a runnable Scene class using `new Function()`.

### `createDynamicGame(parentElement, userCode, config): Phaser.Game`
Creates a complete Phaser game with the dynamically compiled scene.

### `validateUserCode(userCode: string): ValidationResult`
Validates user code for syntax errors and potentially unsafe patterns.

## Usage Examples

### Basic Method-Only Code
```javascript
create() {
  this.player = this.add.rectangle(100, 100, 32, 32, 0x00ff00);
  this.physics.add.existing(this.player, false);
}

update() {
  const speed = 200;
  if (this.cursors.left.isDown) {
    this.player.body.setVelocityX(-speed);
  }
}
```

### Complete Class Code
```javascript
class DynamicScene extends Phaser.Scene {
  constructor() {
    super({ key: "DynamicScene" });
  }
  
  preload() {
    // Load assets
  }
  
  create() {
    // Setup game objects
  }
  
  update() {
    // Game logic
  }
}
```

## Safety Features

- **Syntax Validation**: Basic JavaScript syntax checking
- **Dangerous Pattern Detection**: Blocks potentially unsafe code like `eval()`, `fetch()`, etc.
- **Error Display**: User-friendly error messages with dismissible overlay
- **Sandboxed Execution**: Code runs in isolated function scope

## Configuration

The game configuration is centralized in `GAME_CONFIG`:

```typescript
interface GameConfig {
  backgroundColor: string;
  gravity: { x: number; y: number };
  player: { /* player properties */ };
  platforms: Array<{ /* platform properties */ }>;
  controls: { /* control mappings */ };
}
```

## Development

1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev`
3. **Edit code in Monaco editor**
4. **Click "Run Game" to see changes**

## Best Practices

1. **Use Method-Only Mode**: For simple games, just write `create()` and `update()` methods
2. **Use Complete Class Mode**: For complex games requiring `preload()` or custom properties
3. **Handle Errors**: Always check for `this.player` existence in `update()`
4. **Focus Management**: The canvas is automatically focused, but you can add custom focus logic
5. **Physics**: Use `this.physics.add.existing()` to add physics bodies to game objects

## Troubleshooting

- **Input not working**: Ensure the canvas has focus (handled automatically)
- **Physics not working**: Check that you're using `this.physics.add.existing()` correctly
- **Code not updating**: Click "Run Game" after making changes
- **Errors**: Check the error overlay for specific issues
