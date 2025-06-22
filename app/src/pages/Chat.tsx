import { useEffect, useRef, useState } from 'react';
import '../App.css'
import { PhaserGame } from '../components/PhaserGames';
import Editor from "@monaco-editor/react"
import { 
  DEFAULT_SCENE_BOILERPLATE, 
  ADVANCED_SCENE_EXAMPLE,
  GAME_CONFIG 
} from '@/utils/generateGame';

import { openAIService } from '../services/openaiService';
import { createGameFromSchema } from '../utils/generateGame';
import { GameSchema } from '../types/gameSchema';


// Enhanced boilerplate with working game example
const ENHANCED_BOILERPLATE = `// Edit the create() and update() methods below
// You have access to 'this' which is your Phaser.Scene instance

create() {
  // Create a player rectangle
  this.player = this.add.rectangle(100, 100, 32, 32, 0x00ff00);
  this.physics.add.existing(this.player, false);
  this.player.body.setCollideWorldBounds(true);
  this.player.body.setBounce(0.3, 0.3);
  
  // Create a static group for platforms and walls
  this.platforms = this.physics.add.staticGroup();

  // Create a ground platform (for 400x400 area)
  const ground = this.add.rectangle(200, 390, 400, 20, 0xff0000);
  this.physics.add.existing(ground, true);
  this.platforms.add(ground);

  // Create left wall (shorter, visible)
  const leftWall = this.add.rectangle(20, 300, 40, 150, 0x8888ff);
  this.physics.add.existing(leftWall, true);
  this.platforms.add(leftWall);

  // Create right wall (shorter, visible)
  const rightWall = this.add.rectangle(380, 300, 40, 150, 0x8888ff);
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

}
`;

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [configIndex, setConfigIndex] = useState(0);
  const [phaserCode, setPhaserCode] = useState(ENHANCED_BOILERPLATE);
  const [showCode, setShowCode] = useState(true); // Start with code editor visible
  const [isRunning, setIsRunning] = useState(false);
  // Add these state variables in your component
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<GameSchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add this function to handle AI generation
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await openAIService.generateGameSchema(aiPrompt);
      
      if (response.success && response.gameSchema) {
        setCurrentSchema(response.gameSchema);
        
        // Generate the game from the schema
        const { config, code } = createGameFromSchema(response.gameSchema);
        
        // Update the Phaser code
        setPhaserCode(code);
        setIsRunning(false);
        
        // Show success message
        console.log('Generated game schema:', response.gameSchema);
      } else {
        setError(response.error || 'Failed to generate game schema');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Initialize with enhanced boilerplate
  useEffect(() => {
    setPhaserCode(ENHANCED_BOILERPLATE);
  }, []);

  // Helper to focus the Phaser canvas
  function focusPhaserCanvas() {
    // Only focus canvas if game is visible and running
    if (!showCode && isRunning) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.setAttribute('tabindex', '0');
        canvas.focus();
      }
    }
  }

  // Focus the Phaser canvas only when game is visible
  useEffect(() => {
    if (!showCode && isRunning) {
      // Small delay to ensure canvas is rendered
      const timer = setTimeout(focusPhaserCanvas, 100);
      return () => clearTimeout(timer);
    }
  }, [showCode, isRunning]);

  // Handle game preview click to focus canvas
  const handleGamePreviewClick = () => {
    if (!showCode && isRunning) {
      focusPhaserCanvas();
    }
  };

  const handleRun = () => {
    setIsRunning(true);
    // The PhaserGame component will automatically pick up the code changes
  };

  const handleReset = () => {
    setPhaserCode(ENHANCED_BOILERPLATE);
    setIsRunning(false);
  };

  const handleLoadAdvanced = () => {
    setPhaserCode(ADVANCED_SCENE_EXAMPLE);
    setIsRunning(false);
  };

  const handleLoadBasic = () => {
    setPhaserCode(DEFAULT_SCENE_BOILERPLATE);
    setIsRunning(false);
  };

  return (
    <div
      className="min-h-screen bg-[#181c24] text-[#e5e7ef] flex items-center justify-center p-4"
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="w-full max-w-7xl mx-auto rounded-xl shadow-lg bg-[#23272f] flex flex-col h-[calc(100vh-2rem)]">
        <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden w-full">
          {/* Left Side: Code Editor */}
          <div className="flex flex-col w-1/2 min-w-0 h-full border-r border-[#2c2f36]">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-2 border-b border-[#2c2f36] bg-[#2c2f36] flex-shrink-0">
              <span className="font-semibold text-sm">Scene Code Editor</span>
              <div className="flex gap-2">
                <button
                  onClick={handleLoadBasic}
                  className="bg-[#444] text-white py-1 px-2 rounded text-xs hover:bg-[#555] transition-colors"
                  title="Load basic template"
                >
                  Basic
                </button>
                <button
                  onClick={handleLoadAdvanced}
                  className="bg-[#444] text-white py-1 px-2 rounded text-xs hover:bg-[#555] transition-colors"
                  title="Load advanced example"
                >
                  Advanced
                </button>
                <button
                  onClick={handleReset}
                  className="bg-[#666] text-white py-1 px-3 rounded text-sm hover:bg-[#777] transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleRun}
                  className="bg-[#00ff00] text-black py-1 px-3 rounded font-bold text-sm hover:bg-[#39ff14] transition-colors"
                >
                  Run Game
                </button>
              </div>
            </div>
            <div className="p-3 border-b border-[#2c2f36] bg-[#2c2f36]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your game (e.g., 'A lava platformer with double jump and spikes')"
                  className="flex-1 bg-[#1e1e1e] text-white px-3 py-2 rounded border border-[#444] focus:border-[#00ffff] outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleAIGenerate()}
                />
                <button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="bg-[#00ff00] text-black px-4 py-2 rounded font-bold hover:bg-[#39ff14] disabled:bg-[#666] disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              
              {error && (
                <div className="mt-2 text-red-400 text-sm">
                  Error: {error}
                </div>
              )}
              
              {currentSchema && (
                <div className="mt-2 p-2 bg-[#1e1e1e] rounded border border-[#444]">
                  <div className="text-sm font-semibold mb-1">Generated Schema:</div>
                  <pre className="text-xs text-[#ccc] overflow-auto">
                    {JSON.stringify(currentSchema, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language='javascript'
                value={phaserCode}
                onChange={(value) => {
                  setPhaserCode(value || ENHANCED_BOILERPLATE);
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
          
          {/* Right Side: Game Preview */}
          <div className="flex flex-col w-1/2 min-w-0 h-full">
            <div className="flex flex-row items-center justify-between p-2 border-b border-[#2c2f36] bg-[#2c2f36] flex-shrink-0">
              <div className="flex">
                <button
                  className={`mr-2 px-4 py-1 rounded font-bold text-sm ${!showCode ? 'bg-[#00ffff] text-[#181c24]' : 'bg-[#23272f] text-[#e5e7ef] border border-[#00ffff]'}`}
                  onClick={() => setShowCode(false)}
                >
                  Game
                </button>
                <button
                  className={`px-4 py-1 rounded font-bold text-sm ${showCode ? 'bg-[#00ffff] text-[#181c24]' : 'bg-[#23272f] text-[#e5e7ef] border border-[#00ffff]'}`}
                  onClick={() => setShowCode(true)}
                >
                  Code
                </button>
              </div>
              {isRunning && (
                <div className="text-green-400 text-sm font-mono">
                  ● Running
                </div>
              )}
            </div>
            
            {showCode ? (
              <div className="flex-1 p-2 flex flex-col min-h-0 min-w-0">
                <span className="block mb-1 font-semibold text-sm">Generated Code Preview</span>
                <div className="flex-1 bg-[#1e1e1e] rounded border border-[#2c2f36] p-4 overflow-auto">
                  <pre className="text-xs text-[#d4d4d4] font-mono whitespace-pre-wrap">
                    {phaserCode}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-2 flex flex-col min-h-0 min-w-0">
                <span className="block mb-1 font-semibold text-sm">Game Preview</span>
                <div 
                  className="flex-1 border border-[#2c2f36] rounded overflow-hidden cursor-pointer"
                  onClick={handleGamePreviewClick}
                >
                  <PhaserGame configIndex={configIndex} code={phaserCode}/>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="p-3 bg-[#2c2f36] rounded-b-xl text-sm flex-shrink-0">
          <div className="font-semibold mb-2">Instructions:</div>
          <ul className="list-disc list-inside space-y-1 text-[#ccc]">
            <li>Edit the <code className="bg-[#1e1e1e] px-1 rounded">create()</code> method to add game objects</li>
            <li>Edit the <code className="bg-[#1e1e1e] px-1 rounded">update()</code> method to handle movement and logic</li>
            <li>Use <code className="bg-[#1e1e1e] px-1 rounded">this.add.rectangle()</code> to create shapes</li>
            <li>Use <code className="bg-[#1e1e1e] px-1 rounded">this.physics.add.existing()</code> to add physics</li>
            <li>Click "Run Game" to see your changes in action</li>
            <li>Use arrow keys or WASD to control the player</li>
            <li>Try "Advanced" for a complete Scene class example</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
