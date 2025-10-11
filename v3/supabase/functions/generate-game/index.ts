import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, conversationHistory = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating Phaser game for prompt:', prompt);

    const systemPrompt = `You are an expert Phaser 3 game developer. Generate complete, playable games using Phaser 3 framework.

CRITICAL: You MUST respond with a JSON object containing multiple organized files. NO OTHER FORMAT IS ACCEPTABLE.

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

CRITICAL: Respond ONLY with valid JSON. No markdown, no explanations.
CRITICAL: All code MUST be properly formatted with newlines and indentation!`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: prompt }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.9,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let gameResponse = data.choices[0].message.content;

    console.log('Phaser game generated successfully');

    // Parse the JSON response to extract files
    gameResponse = gameResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let files;
    try {
      files = JSON.parse(gameResponse);
    } catch (parseError) {
      console.error('Failed to parse game response as JSON:', parseError);
      console.error('Raw response:', gameResponse);
      throw new Error('AI did not return valid JSON format');
    }

    // Validate that we have required files
    if (!files['index.html'] || !files['styles.css']) {
      throw new Error('Missing required files (index.html, styles.css)');
    }
    
    // Ensure at least one JS file exists
    const jsFiles = Object.keys(files).filter(key => key.endsWith('.js'));
    if (jsFiles.length === 0) {
      throw new Error('No JavaScript files found');
    }
    
    console.log('Created files:', Object.keys(files));

    // Process assets if assets.json exists
    if (files['assets.json']) {
      console.log('Processing asset metadata...');
      try {
        // Handle both string and object formats
        const assetsMetadata = typeof files['assets.json'] === 'string' 
          ? JSON.parse(files['assets.json']) 
          : files['assets.json'];
        
        // Generate sprites that are marked for generation
        if (assetsMetadata.sprites) {
          for (const [key, assetInfo] of Object.entries(assetsMetadata.sprites)) {
            const asset = assetInfo as any;
            if (asset.generate) {
              console.log(`Generating sprite: ${key} at size ${asset.size[0]}x${asset.size[1]}`);
              
              // Determine appropriate base size for generation
              const [targetWidth, targetHeight] = asset.size;
              const scaleFactor = Math.max(1, Math.min(4, Math.floor(512 / Math.max(targetWidth, targetHeight))));
              const genWidth = targetWidth * scaleFactor;
              const genHeight = targetHeight * scaleFactor;
              
              // Call Lovable AI image generation with explicit size constraints
              const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash-image-preview',
                  messages: [
                    {
                      role: 'user',
                      content: `Generate a pixel art game sprite: ${asset.description}. CRITICAL: Image must be EXACTLY ${genWidth}x${genHeight} pixels (will be scaled to ${targetWidth}x${targetHeight}). Transparent background PNG. Centered sprite. Top-down or side view for a 2D game. No text or UI elements.`
                    }
                  ],
                  modalities: ['image', 'text']
                }),
              });

              if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
                
                if (imageUrl) {
                  files[`assets/sprites/${key}.png`] = imageUrl;
                  console.log(`Generated sprite: ${key} at ${genWidth}x${genHeight}, target: ${targetWidth}x${targetHeight}`);
                }
              }
            }
          }
        }
      } catch (assetError) {
        console.error('Error processing assets:', assetError);
        // Continue without assets - game will use placeholders
      }
    }

    // Generate a friendly response
    const assistantResponse = conversationHistory.length === 0 
      ? "I've created your Phaser game! Try it out and let me know if you want any changes."
      : "I've updated your Phaser game with the changes you requested!";

    return new Response(JSON.stringify({ 
      files,
      response: assistantResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-game function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
