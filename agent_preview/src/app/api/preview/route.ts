import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const projectPath = path.join(process.cwd(), "example-project");
    
    // Check if we have an index.html file
    const indexPath = path.join(projectPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      // Serve the existing index.html with modified script sources
      let content = fs.readFileSync(indexPath, "utf-8");
      
      // Replace any relative script sources to use our API
      content = content.replace(
        /src="([^"]+\.js)"/g,
        (match, src) => {
          // Don't modify external URLs
          if (src.startsWith('http') || src.startsWith('//')) {
            return match;
          }
          return `src="/api/${src}"`;
        }
      );
      
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }
    
    // Get all JavaScript/TypeScript files recursively
    function getAllJSFiles(dir: string, baseDir: string = dir): string[] {
      const files: string[] = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...getAllJSFiles(fullPath, baseDir));
        } else if (item.endsWith('.js') || item.endsWith('.ts')) {
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          files.push(relativePath);
        }
      }
      
      return files;
    }
    
    const gameFiles = getAllJSFiles(projectPath);
    
    // Sort files to load main.js first if it exists
    gameFiles.sort((a, b) => {
      if (a.includes('main.')) return -1;
      if (b.includes('main.')) return 1;
      return a.localeCompare(b);
    });

    // Generate HTML template
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phaser.js Game Preview</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #2c3e50;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
        }
        #game-container {
            border: 2px solid #34495e;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .error {
            color: #e74c3c;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            text-align: center;
        }
        .loading {
            color: #3498db;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .debug {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            max-width: 300px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <div class="loading">Loading game...</div>
    </div>
    
    <div class="debug" id="debug">
        Loading files: ${gameFiles.length} found<br>
        Files: ${gameFiles.join(', ')}
    </div>

    <script>
        // Debug logging
        function debugLog(message) {
            console.log('[Game] ' + message);
            const debugEl = document.getElementById('debug');
            if (debugEl) {
                debugEl.innerHTML += '<br>' + message;
            }
        }

        // Error handling
        window.addEventListener('error', function(e) {
            debugLog('Error: ' + e.message);
            document.getElementById('game-container').innerHTML = 
                '<div class="error"><h3>Game Error</h3><p>' + e.message + '</p><p>Check console for details</p></div>';
        });

        // Wait for Phaser to load, then load our game scripts
        function waitForPhaser() {
            if (typeof Phaser !== 'undefined') {
                debugLog('Phaser loaded successfully');
                setTimeout(loadScripts, 50); // Small delay to ensure Phaser is fully ready
            } else {
                debugLog('Waiting for Phaser...');
                setTimeout(waitForPhaser, 100);
            }
        }

        // Load scripts sequentially
        async function loadScripts() {
            const scripts = ${JSON.stringify(gameFiles)};
            
            for (const script of scripts) {
                try {
                    debugLog('Loading: ' + script);
                    await loadScript('/api/' + script);
                    debugLog('Loaded: ' + script);
                    // Small delay between scripts to ensure proper execution order
                    await new Promise(resolve => setTimeout(resolve, 50));
                } catch (error) {
                    debugLog('Failed to load: ' + script + ' - ' + error.message);
                }
            }
            
            // After all scripts are loaded, try to initialize game
            setTimeout(initializeGame, 200);
        }
        
        function loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = false; // Ensure scripts load in order
                script.onload = () => {
                    debugLog('Script loaded: ' + src);
                    resolve();
                };
                script.onerror = () => {
                    debugLog('Script failed: ' + src);
                    reject(new Error('Failed to load ' + src));
                };
                document.head.appendChild(script);
            });
        }
        
        function initializeGame() {
            debugLog('Initializing game...');
            
            // Remove loading message
            const container = document.getElementById('game-container');
            container.innerHTML = '';
            
            // Try to find and start the game
            if (typeof window.game !== 'undefined') {
                debugLog('Game already initialized');
                return;
            }
            
            // Look for common game initialization patterns
            if (typeof window.startGame === 'function') {
                debugLog('Found startGame function');
                window.startGame();
            } else if (typeof window.init === 'function') {
                debugLog('Found init function');
                window.init();
            } else if (typeof window.initGame === 'function') {
                debugLog('Found initGame function');
                window.initGame();
            } else if (typeof Phaser !== 'undefined') {
                debugLog('Creating default Phaser game');
                // Create a basic Phaser game if no game config is found
                const config = {
                    type: Phaser.AUTO,
                    width: 800,
                    height: 600,
                    parent: 'game-container',
                    backgroundColor: '#2c3e50',
                    physics: {
                        default: 'arcade',
                        arcade: {
                            gravity: { y: 0 },
                            debug: false
                        }
                    },
                    scene: {
                        preload: function() {
                            debugLog('Phaser scene preload');
                            this.add.text(10, 10, 'Phaser.js Game Preview', { 
                                fontSize: '24px', 
                                fill: '#fff' 
                            });
                        },
                        create: function() {
                            debugLog('Phaser scene create');
                            this.add.text(10, 50, 'Game loaded successfully!', { 
                                fontSize: '16px', 
                                fill: '#2ecc71' 
                            });
                            this.add.text(10, 80, 'Files loaded: ${gameFiles.length}', { 
                                fontSize: '14px', 
                                fill: '#3498db' 
                            });
                            this.add.text(10, 110, 'Click to refresh if your game doesn\\'t appear', { 
                                fontSize: '12px', 
                                fill: '#95a5a6' 
                            });
                        }
                    }
                };
                window.game = new Phaser.Game(config);
            } else {
                debugLog('No game initialization method found');
                container.innerHTML = '<div class="error"><h3>No Game Found</h3><p>Could not find game initialization code</p></div>';
            }
        }
        
        // Start the process - but first check if Phaser script is already loaded
        if (typeof Phaser !== 'undefined') {
            debugLog('Phaser already available');
            setTimeout(loadScripts, 50);
        } else {
            debugLog('Waiting for Phaser to load...');
            waitForPhaser();
        }
        
        // Also set up a fallback timeout
        setTimeout(() => {
            if (typeof Phaser === 'undefined') {
                debugLog('Phaser failed to load - network issue?');
                document.getElementById('game-container').innerHTML = 
                    '<div class="error"><h3>Phaser Loading Error</h3><p>Failed to load Phaser.js from CDN. Check your internet connection.</p></div>';
            }
        }, 10000); // 10 second timeout
    </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("Error generating preview:", error);
    
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Preview Error</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #2c3e50; 
            color: #fff; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh; 
            margin: 0; 
        }
        .error { 
            background: #e74c3c; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            max-width: 500px; 
        }
    </style>
</head>
<body>
    <div class="error">
        <h2>Preview Error</h2>
        <p>Failed to generate game preview: ${error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
</body>
</html>`;

    return new NextResponse(errorHtml, {
      headers: { "Content-Type": "text/html" },
    });
  }
}
