import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { prompt, conversationHistory = [] } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }
    console.log('Generating Phaser game for prompt:', prompt);
    const systemPrompt = `You are an expert Phaser 3 game developer. Generate complete, playable games using Phaser 3 framework.

CRITICAL: You MUST use the generate_game_files function to return your game files. Call this function with a 'files' object containing all game files.

REQUIRED FILE STRUCTURE - You MUST create multiple files:

FOR SIMPLE GAMES (Snake, Pong, Breakout, Flappy Bird):
{
  "index.html": "<!DOCTYPE html with Phaser CDN>",
  "styles.css": "/* Game container styles */",
  "game.js": "// Phaser config and game initialization",
  "MainScene.js": "// Main game scene with all game logic",
  "assets.json": "// Asset metadata manifest (if assets needed)"
}

FOR COMPLEX GAMES (Platformers, Shooters, RPGs):
{
  "index.html": "<!DOCTYPE html with Phaser CDN>",
  "styles.css": "/* Game container styles */",
  "game.js": "// Phaser config and scene registration",
  "MenuScene.js": "// Menu/start scene",
  "GameScene.js": "// Main gameplay scene",
  "Player.js": "// Player sprite class",
  "Enemy.js": "// Enemy sprite classes",
  "assets.json": "// Asset metadata manifest"
}

PHASER 3 REQUIREMENTS:
1. **index.html** - Include Phaser 3 CDN: <script src="https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js"></script>
2. **index.html** - Add <div id="game-container"></div> for the game
3. **styles.css** - Center the game, dark background (#0a0a0f), responsive design
4. **game.js** - Phaser.Game config with: type: Phaser.AUTO, width: 800, height: 600, physics, scenes array
5. **Scene files** - Extend Phaser.Scene, use preload(), create(), update() methods
6. Use Phaser's built-in: physics, sprites, animations, input handling, collision detection
7. Add visual graphics using Phaser.GameObjects (rectangles, circles, text for simple games)
8. Use this.physics.add for collision detection
9. Use this.input.keyboard for controls
10. Add game instructions as Phaser.GameObjects.Text in the scene
11. **CRITICAL**: When loading assets, use: this.load.image('key', window.gameAssets['assets/sprites/name.png']) to access base64 data

CODE FORMATTING RULES:
- **CRITICAL**: Use proper newlines (\\n) in ALL code
- **CRITICAL**: Proper indentation (2 or 4 spaces)
- **CRITICAL**: Each statement on its own line
- **CRITICAL**: Readable, well-structured code
- NEVER put entire files on one line

PHASER BEST PRACTICES:
- Use scene lifecycle: preload() → create() → update()
- Use this.add for game objects
- Use this.physics.add for physics bodies
- Use this.tweens for smooth animations
- Add restart functionality
- Display score using Phaser.GameObjects.Text
- Use simple shapes (rectangles/circles) for quick prototypes
- For sprites, use Phaser graphics or simple colored rectangles

GAME REQUIREMENTS:
- Fully playable and functional Phaser 3 game
- Clear in-game instructions
- Score display
- Game over and restart functionality
- Smooth gameplay at 60 FPS
- Responsive controls
- Visual polish with Phaser effects

ASSET MANAGEMENT (METADATA-DRIVEN):
1. **Asset Philosophy**: Assets are decoupled, metadata-driven resources
2. **assets.json Structure**:
   {
     "sprites": {
       "player": { "description": "Main player character sprite", "size": [32, 32], "generate": true },
       "enemy": { "description": "Enemy sprite", "size": [32, 32], "generate": true }
     },
     "audio": {
       "bgm": { "description": "Background music", "generate": false },
       "jump": { "description": "Jump sound effect", "generate": false }
     },
     "tilesets": {}
   }
3. **When to Include assets.json**:
   - Include ONLY if the game would benefit from visual sprites/textures
   - For simple games (Snake, Pong), use Phaser graphics (rectangles/circles) - NO assets.json
   - For games with entities (Platformer, Shooter, RPG), include assets.json with sprite metadata
4. **Asset References**:
   - In scene code, load assets by key: this.load.image('player', 'assets/sprites/player.png')
   - Use placeholder graphics initially: this.add.rectangle(x, y, 32, 32, 0x00ff00)
   - Assets will be auto-generated and injected based on metadata
5. **Naming Conventions**:
   - sprites/[category]/[name].png (e.g., sprites/player/idle.png)
   - audio/[category]/[name].mp3
   - Consistent, predictable paths
6. **Self-Correction**:
   - Mark assets with "generate": true if they should be AI-generated
   - System will auto-detect and generate missing assets

CONVERSATION MODE:
- If follow-up request, modify existing game files
- Maintain functionality unless explicitly changed
- Return ALL files even if only one changed
- Update assets.json if new entities are added

ERROR FIXING MODE:
- If you receive a "RUNTIME ERROR DETECTED" or "VALIDATION ERRORS DETECTED" message:
  * Carefully analyze the error message, stack trace, file, and line number
  * Identify the root cause of the error
  * Fix the specific issue in the relevant file(s)
  * Test your logic mentally to ensure the fix is correct
  * Return ALL game files with the fix applied
  * Common errors to watch for:
    - Undefined variables or functions
    - Missing Phaser scene methods (preload, create, update)
    - Incorrect physics configuration
    - Asset loading issues
    - Syntax errors in JavaScript
    - Missing semicolons or brackets

CRITICAL: Use the generate_game_files function to return all files.
CRITICAL: All code MUST be properly formatted with newlines and indentation!`;
    // Build messages as Gemini "contents"
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: systemPrompt
          }
        ]
      },
      ...conversationHistory.map((msg)=>({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [
            {
              text: msg.content
            }
          ]
        })),
      {
        role: 'user',
        parts: [
          {
            text: prompt
          }
        ]
      }
    ];
    // Define the function/tool schema for structured output
    const tools = [
      {
        functionDeclarations: [
          {
            name: "generate_game_files",
            description: "Generate complete Phaser 3 game files with proper structure",
            parameters: {
              type: "object",
              properties: {
                files: {
                  type: "object",
                  description: "Object containing all game files with filename as key and code content as value",
                  properties: {
                    "index.html": {
                      type: "string",
                      description: "Main HTML file with Phaser CDN"
                    },
                    "styles.css": {
                      type: "string",
                      description: "CSS styles for game container"
                    },
                    "game.js": {
                      type: "string",
                      description: "Phaser game configuration and initialization"
                    }
                  },
                  required: ["index.html", "styles.css", "game.js"]
                }
              },
              required: ["files"]
            }
          }
        ]
      }
    ];

    // === Gemini function calling request ===
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GOOGLE_API_KEY
      },
      body: JSON.stringify({
        contents,
        tools,
        toolConfig: {
          functionCallingConfig: {
            mode: "ANY",
            allowedFunctionNames: ["generate_game_files"]
          }
        },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 32768
        }
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.status}`);
    }
    const data = await response.json();
    
    // Extract function call from Gemini response
    const functionCall = data.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.functionCall?.name === "generate_game_files"
    );
    
    if (!functionCall) {
      console.error('No function call found in response:', JSON.stringify(data, null, 2));
      throw new Error('AI did not return structured function call');
    }
    
    const files = functionCall.functionCall.args.files;
    
    console.log('Phaser game generated successfully via function call');
    
    // Validate required files
    if (!files['index.html'] || !files['styles.css']) {
      throw new Error('Missing required files (index.html, styles.css)');
    }
    const jsFiles = Object.keys(files).filter((key)=>key.endsWith('.js'));
    if (jsFiles.length === 0) {
      throw new Error('No JavaScript files found');
    }
    console.log('Created files:', Object.keys(files));
    // Skip image generation section (Gemini Flash doesn’t support images)
    if (files['assets.json']) {
      console.log('Skipping sprite generation (Gemini Flash model only supports text).');
    }
    // Friendly message
    const assistantResponse = conversationHistory.length === 0 ? "I've created your Phaser game! Try it out and let me know if you want any changes." : "I've updated your Phaser game with the changes you requested!";
    // Generate short game title using Gemini
    let gameTitle = null;
    if (conversationHistory.length === 0) {
      const titleResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Based on this game description: "${prompt}"\n\nGenerate a short, catchy game title (maximum 4 words). Respond with ONLY the title.`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 20
          }
        })
      });
      if (titleResponse.ok) {
        const titleData = await titleResponse.json();
        gameTitle = titleData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.replace(/['"]/g, '');
      }
    }
    return new Response(JSON.stringify({
      files,
      response: assistantResponse,
      gameTitle
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in generate-game function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
