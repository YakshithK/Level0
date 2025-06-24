import { useEffect, useState } from 'react';
import '../App.css';
import { PhaserGame } from '../components/PhaserGames';
import Editor from "@monaco-editor/react";
import { anthropicService } from '../services/anthropicService';

export default function Chat() {
  const [phaserCode, setPhaserCode] = useState("");
  const [showCode, setShowCode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleInitialPrompt = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const code = await anthropicService.generatePhaserScene(aiPrompt);
      if (code && code.trim()) {
        setPhaserCode(code);
        setIsRunning(false);
        setHasGenerated(true);
      } else {
        setError('No code was generated.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  function focusPhaserCanvas() {
    if (!showCode && isRunning) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.setAttribute('tabindex', '0');
        canvas.focus();
      }
    }
  }

  useEffect(() => {
    if (!showCode && isRunning) {
      const timer = setTimeout(focusPhaserCanvas, 100);
      return () => clearTimeout(timer);
    }
  }, [showCode, isRunning]);

  const handleGamePreviewClick = () => {
    if (!showCode && isRunning) {
      focusPhaserCanvas();
    }
  };

  const handleRun = () => {
    setIsRunning(true);
  };

  const handleReset = () => {
    setPhaserCode("");
    setIsRunning(false);
  };

  if (!hasGenerated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181c24]">
        <form
          className="w-full max-w-xl mx-auto flex flex-col items-center justify-center"
          onSubmit={e => {
            e.preventDefault();
            handleInitialPrompt();
          }}
        >
          <textarea
            className="w-full h-32 p-4 rounded-lg border border-[#444] bg-[#23272f] text-white text-lg focus:outline-none focus:border-[#00ffff] resize-none shadow-lg"
            placeholder="Describe your game (e.g., 'A lava platformer with double jump and spikes')"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleInitialPrompt();
              }
            }}
            disabled={isGenerating}
            autoFocus
          />
          <button
            type="submit"
            className="mt-6 bg-[#00ff00] text-black px-8 py-3 rounded font-bold text-lg hover:bg-[#39ff14] disabled:bg-[#666] disabled:cursor-not-allowed transition-colors shadow"
            disabled={isGenerating || !aiPrompt.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate Game'}
          </button>
          {error && (
            <div className="mt-4 text-red-400 text-base">Error: {error}</div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#181c24] text-[#e5e7ef] flex items-center justify-center p-4"
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="w-full max-w-7xl mx-auto rounded-xl shadow-lg bg-[#23272f] flex flex-col h-[calc(100vh-2rem)]">
        <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden w-full">
          {/* Left Side: Chat Preview Placeholder */}
          <div className="flex flex-col w-1/2 min-w-0 h-full border-r border-[#2c2f36] bg-[#23272f]">
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[#888] text-lg">Chat Preview Coming Soon...</span>
            </div>
            {/* Chat input at the bottom */}
            <form
              className="p-4 border-t border-[#2c2f36] bg-[#23272f]"
              onSubmit={e => {
                e.preventDefault();
                handleInitialPrompt();
              }}
            >
              <input
                type="text"
                className="w-full px-4 py-2 rounded border border-[#444] bg-[#181c24] text-white text-base focus:outline-none focus:border-[#00ffff]"
                placeholder="Type your game prompt and press Enter..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleInitialPrompt();
                  }
                }}
                disabled={isGenerating}
                autoFocus
              />
            </form>
          </div>
          {/* Right Side: Toggle between Game Preview and Monaco Editor */}
          <div className="flex flex-col w-1/2 min-w-0 h-full border-l border-[#2c2f36]">
            {/* Toggle Buttons */}
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
            {/* Game Preview or Monaco Editor */}
            {!showCode ? (
              <div className="flex-1 p-2 flex flex-col min-h-0 min-w-0">
                <span className="block mb-1 font-semibold text-sm">Game Preview</span>
                <div 
                  className="flex-1 border border-[#2c2f36] rounded overflow-hidden cursor-pointer"
                  onClick={handleGamePreviewClick}
                >
                  <PhaserGame configIndex={0} code={phaserCode}/>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                {/* Editor Header */}
                <div className="flex items-center justify-between p-2 border-b border-[#2c2f36] bg-[#23272f] flex-shrink-0">
                  <span className="font-semibold text-sm">Scene Code Editor</span>
                  <div className="flex gap-2">
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
                {/* Monaco Editor */}
                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    language='javascript'
                    value={phaserCode}
                    onChange={(value) => {
                      setPhaserCode(value || "");
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
