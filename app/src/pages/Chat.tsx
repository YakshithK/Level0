import { useEffect, useRef, useState } from 'react';
import '../App.css'
import { PhaserGame } from '../components/PhaserGames';
import Editor from "@monaco-editor/react"
import { generatePhaserCode } from '@/utils/generateGame';

const CONFIGS_LENGTH = 2

const configs = [
  {
    backgroundColor: "#1e1e2f",
    gravity: { y: 600 },
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
  },
  {
    backgroundColor: "#1e1e2f",
    gravity: { y: 600 },
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
  }
]

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [configIndex, setConfigIndex] = useState(0);
  const [phaserCode, setPhaserCode] = useState("")
  const [showCode, setShowCode] = useState(false);

  // Add global keydown listener for debugging
  useEffect(() => {
    const handler = (e) => {
      console.log('[REACT GLOBAL] keydown:', e.code, e.key, e.keyCode);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Helper to focus the Phaser canvas
  function focusPhaserCanvas() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.setAttribute('tabindex', '0');
      canvas.focus();
    }
  }

  // Focus the Phaser canvas on mount and on every click
  useEffect(() => {
    focusPhaserCanvas();
    window.addEventListener('click', focusPhaserCanvas);
    return () => window.removeEventListener('click', focusPhaserCanvas);
  }, []);

  useEffect(() => {
    setPhaserCode(generatePhaserCode(configs[configIndex]));
  }, [configIndex])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const newIndex = (configIndex + 1) % CONFIGS_LENGTH;
    setConfigIndex(newIndex);
    setPhaserCode(generatePhaserCode(configs[newIndex]));
  };

  return (
    <div
      className="min-h-screen bg-[#181c24] text-[#e5e7ef] flex items-center justify-center"
      tabIndex={0}
      style={{ outline: 'none' }}
      onClick={e => e.currentTarget.focus()}
    >
      <div className="w-full max-w-7xl mx-auto my-2 rounded-xl shadow-lg p-4 bg-[#23272f] flex flex-col h-[80vh]">
        <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden w-full h-full">
          {/* Left Side: Chat */}
          <div className="flex flex-col w-1/2 min-w-0 h-full border-r border-[#2c2f36]">
            {/* Monaco Editor Placeholder */}
            <div className="flex-1 p-2 overflow-auto min-h-0 min-w-0">
              <span className="block mb-1 font-semibold text-sm">Code Editor (Monaco Placeholder)</span>
              <div className="w-full h-32 border rounded bg-[#2c2f36] flex items-center justify-center text-[#888] text-sm">
                Monaco Editor Placeholder
              </div>
            </div>
            {/* Chat Input Area */}
            <div className="p-2 border-t border-[#2c2f36] bg-[#2c2f36]">
              <form className="flex gap-1" onSubmit={handleSend}>
                <textarea
                  className="flex-1 border rounded p-1 bg-[#23272f] text-[#e5e7ef] min-h-[32px] resize-y text-sm"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe your game idea..."
                />
                <button className="bg-[#00ffff] text-[#181c24] py-1 px-3 rounded font-bold hover:bg-[#39ff14] transition-colors h-fit self-end text-sm">
                  Send
                </button>
              </form>
            </div>
          </div>
          {/* Right Side: Preview */}
          <div className="flex flex-col w-1/2 min-w-0 h-full">
            <div className="flex flex-row items-center mb-2">
              <button
                className={`mr-2 px-4 py-1 rounded font-bold ${!showCode ? 'bg-[#00ffff] text-[#181c24]' : 'bg-[#23272f] text-[#e5e7ef] border border-[#00ffff]'}`}
                onClick={() => setShowCode(false)}
              >
                Game
              </button>
              <button
                className={`px-4 py-1 rounded font-bold ${showCode ? 'bg-[#00ffff] text-[#181c24]' : 'bg-[#23272f] text-[#e5e7ef] border border-[#00ffff]'}`}
                onClick={() => setShowCode(true)}
              >
                Code
              </button>
            </div>
            {showCode ? (
            <div className="flex-1 p-2 flex flex-col min-h-0 min-w-0">
              <span className="block mb-1 font-semibold text-sm">Code Editor</span>
              <Editor
                height="100%"
                language='javascript'
                value={phaserCode}
                onChange={(value) => {
                  setPhaserCode(value || "");
                }}
              />
            </div>
            ) : (
            <div className="flex-1 p-2 flex flex-col min-h-0 min-w-0">
              <span className="block mb-1 font-semibold text-sm">Game Preview</span>
              <PhaserGame configIndex={configIndex} code={phaserCode}/>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
