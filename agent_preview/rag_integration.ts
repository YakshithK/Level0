import fs from 'fs';
import path from 'path';

export class PhaserRAGRetriever {
  private ragEnabled: boolean = false;
  private phaserExamples: string[] = [];

  constructor() {
    this.loadPhaserExamples();
  }

  private loadPhaserExamples() {
    try {
      // Try to load from vector database first
      const vectorDBPath = path.join(process.cwd(), 'optimization', 'phaser_chunks.jsonl');
      if (fs.existsSync(vectorDBPath)) {
        console.log('🔍 Loading examples from vector database...');
        const content = fs.readFileSync(vectorDBPath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.chunk && parsed.chunk.length > 100) {
              this.phaserExamples.push(parsed.chunk);
            }
          } catch (e) {
            // Skip invalid lines
          }
        }
        
        console.log(`✅ Loaded ${this.phaserExamples.length} examples from vector database`);
      } else {
        // Fallback: Check if we have any Phaser code examples in the workspace
        const examplePaths = [
          'index.html',
          'main.js',
          'game.js',
          'phaser-examples.json'
        ];

        const workspaceRoot = process.cwd();
        
        // Load examples from existing files or a dedicated examples file
        for (const examplePath of examplePaths) {
          const fullPath = path.join(workspaceRoot, examplePath);
          if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (content.includes('Phaser') || content.includes('phaser')) {
              this.phaserExamples.push(content);
            }
          }
        }
      }

      // Always add hardcoded high-quality Phaser examples for common patterns
      this.phaserExamples.push(...this.getBuiltInExamples());
      
      this.ragEnabled = this.phaserExamples.length > 0;
      
      if (this.ragEnabled) {
        console.log(`✅ RAG system loaded with ${this.phaserExamples.length} Phaser code examples`);
      } else {
        console.log('⚠️ No Phaser examples found - RAG system disabled');
      }
    } catch (error) {
      console.warn('Failed to load Phaser examples:', error);
      this.ragEnabled = false;
    }
  }

  private getBuiltInExamples(): string[] {
    return [
      // Player movement example
      `// Player Movement Pattern
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.speed = 300;
    }
    
    update(cursors) {
        this.setVelocity(0);
        if (cursors.left.isDown) this.setVelocityX(-this.speed);
        if (cursors.right.isDown) this.setVelocityX(this.speed);
        if (cursors.up.isDown) this.setVelocityY(-this.speed);
        if (cursors.down.isDown) this.setVelocityY(this.speed);
    }
}`,

      // Enemy spawning example
      `// Enemy Spawning Pattern
class EnemySpawner {
    constructor(scene) {
        this.scene = scene;
        this.enemies = scene.physics.add.group();
        this.spawnTimer = scene.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }
    
    spawnEnemy() {
        const x = Phaser.Math.Between(50, this.scene.scale.width - 50);
        const enemy = this.enemies.create(x, 0, 'enemy');
        enemy.setVelocityY(100);
    }
}`,

      // Bullet shooting example
      `// Bullet Shooting Pattern
class BulletSystem {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.bullets = scene.physics.add.group();
        this.lastFired = 0;
        this.fireRate = 200;
    }
    
    fire() {
        const time = this.scene.time.now;
        if (time > this.lastFired + this.fireRate) {
            const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
            bullet.setVelocityY(-400);
            this.lastFired = time;
        }
    }
}`,

      // Collision detection example
      `// Collision Detection Pattern
setupCollisions() {
    // Player bullets hit enemies
    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
    });
    
    // Enemies hit player
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
        enemy.destroy();
        this.health -= 1;
        if (this.health <= 0) {
            this.scene.start('GameOverScene');
        }
    });
}`,

      // Game scene structure
      `// Basic Game Scene Structure
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    preload() {
        this.load.image('player', 'assets/player.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('bullet', 'assets/bullet.png');
    }
    
    create() {
        this.player = new Player(this, 400, 500);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        this.bulletSystem = new BulletSystem(this, this.player);
        this.enemySpawner = new EnemySpawner(this);
        
        this.setupCollisions();
    }
    
    update() {
        this.player.update(this.cursors);
        if (this.spaceKey.isDown) {
            this.bulletSystem.fire();
        }
    }
}`
    ];
  }

  getRelevantExamples(userPrompt: string, topK: number = 3): string {
    if (!this.ragEnabled) {
      return '';
    }

    try {
      const lowerPrompt = userPrompt.toLowerCase();
      const scoredExamples = this.phaserExamples.map(example => {
        let score = 0;
        const lowerExample = example.toLowerCase();
        
        // Simple keyword scoring
        const keywords = [
          'player', 'enemy', 'bullet', 'shoot', 'collision', 'sprite', 
          'movement', 'spawn', 'physics', 'velocity', 'overlap',
          'scene', 'create', 'update', 'preload', 'group'
        ];
        
        keywords.forEach(keyword => {
          if (lowerPrompt.includes(keyword) && lowerExample.includes(keyword)) {
            score += 1;
          }
        });
        
        return { example, score };
      });

      const relevant = scoredExamples
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(item => item.example);

      if (relevant.length === 0) {
        return '';
      }

      let context = '\n📚 Relevant Phaser.js Examples:\n\n';
      relevant.forEach((example, i) => {
        context += `Example ${i + 1}:\n\`\`\`javascript\n${example.substring(0, 800)}...\n\`\`\`\n\n`;
      });

      return context;
    } catch (error) {
      console.warn('RAG search failed:', error);
      return '';
    }
  }

  enhancePromptWithRAG(originalPrompt: string, userRequest: string, ragEnabled: boolean = true): Promise<string> {
    return new Promise((resolve) => {
      try {
        // Check if RAG is enabled
        if (!ragEnabled) {
          resolve(originalPrompt);
          return;
        }

        // Check if this is a Phaser-related request
        const phaserKeywords = ['phaser', 'game', 'sprite', 'scene', 'player', 'enemy', 'bullet', 'collision', 'physics'];
        const isPhaserRelated = phaserKeywords.some(keyword => 
          userRequest.toLowerCase().includes(keyword) || 
          originalPrompt.toLowerCase().includes(keyword)
        );

        if (!isPhaserRelated || !this.ragEnabled) {
          resolve(originalPrompt);
          return;
        }

        console.log('🔍 Searching for relevant Phaser code examples...');
        const examples = this.getRelevantExamples(userRequest);

        if (examples && examples.length > 50) {
          const enhancedPrompt = `${originalPrompt}

${examples}

Use these Phaser.js code examples as reference for best practices and patterns. Adapt the patterns shown above to fulfill the user's specific request.`;
          console.log('✅ Enhanced prompt with RAG examples');
          resolve(enhancedPrompt);
        } else {
          resolve(originalPrompt);
        }
      } catch (error) {
        console.warn('RAG enhancement failed:', error);
        resolve(originalPrompt);
      }
    });
  }
}

// Singleton instance
export const ragRetriever = new PhaserRAGRetriever();
