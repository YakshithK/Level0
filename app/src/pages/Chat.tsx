import { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import '../App.css';
import { PhaserGame } from '../components/PhaserGames';
import Editor from "@monaco-editor/react";
import { anthropicService } from '../services/anthropicService';

interface LocationState {
  phaserCode: string;
  thinking: string;
  aiPrompt: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  code?: string;
  timestamp: Date;
}

export default function Chat() {
  const location = useLocation();
  const state = location.state as LocationState;
  
  // If no state data, redirect back to landing
  if (!state || !state.phaserCode) {
    return <Navigate to="/" replace />;
  }

  const [phaserCode, setPhaserCode] = useState(state.phaserCode);
  const [showCode, setShowCode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(''); // Clear input on navigation
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinking, setThinking] = useState<string>(state.thinking);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-user',
      type: 'user',
      content: state.aiPrompt,
      timestamp: new Date()
    },
    {
      id: 'initial-ai',
      type: 'ai',
      content: state.thinking,
      code: state.phaserCode,
      timestamp: new Date()
    }
  ]);

  const handleInitialPrompt = async () => {
    if (!aiPrompt.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: aiPrompt,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const currentPrompt = aiPrompt;
    setAiPrompt(''); // Clear input immediately
    setIsGenerating(true);
    setError(null);
    
    // Convert chat messages to the format expected by the service
    const conversationHistory = chatMessages.map(msg => ({
      type: msg.type as 'user' | 'ai',
      content: msg.content
    }));
    
    // Log the conversation history for debugging
    console.log('=== CONVERSATION HISTORY ===');
    console.log('Current prompt:', currentPrompt);
    console.log('Message history:', conversationHistory);
    console.log('Total messages:', conversationHistory.length);
    console.log('===========================');
    
    try {
      const result = await anthropicService.generatePhaserScene(currentPrompt, false, conversationHistory);
      if (result && result.code && result.code.trim()) {
        setPhaserCode(result.code);
        setThinking(result.thinking || "");
        
        // Add AI response to chat (store both thinking and code)
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: result.thinking || "",
          code: result.code,
          timestamp: new Date()
        };
        
        setChatMessages(prev => [...prev, aiMessage]);
        setIsRunning(false);
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

  // Handle input key events to prevent game controls from being captured
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    // Only redirect game keys if the game canvas is currently focused
    const canvas = document.querySelector('canvas');
    const isCanvasFocused = canvas === document.activeElement;
    const isInputFocused = e.currentTarget === document.activeElement;
    
    // If input is focused, allow all typing (including space, W, A, S, D)
    if (isInputFocused) {
      // Handle Enter key for form submission
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleInitialPrompt();
      }
      return; // Allow all other keys to work normally in input
    }
    
    // If game is running, not in code view, and canvas is focused, let game controls pass through
    if (isRunning && !showCode && isCanvasFocused) {
      // Common game control keys - let them pass through to the game
      const gameControlKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space', 'shift', 'control', 'alt'];
      if (gameControlKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        // Focus the game canvas to receive the key event
        if (canvas) {
          canvas.focus();
          // Dispatch the key event to the canvas
          const keyEvent = new KeyboardEvent('keydown', {
            key: e.key,
            code: e.code,
            keyCode: e.keyCode,
            which: e.which,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            bubbles: true,
            cancelable: true
          });
          canvas.dispatchEvent(keyEvent);
        }
        return;
      }
    }
  };

  // Handle input focus to manage game controls
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Only blur input if game is running, not in code view, and user clicks outside input
    // This allows users to actually type in the input when they want to
    console.log('Input focused - allowing typing');
  };

  return (
    <div
      className="min-h-screen bg-[#181c24] text-[#e5e7ef] flex items-center justify-center p-4"
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="w-full max-w-7xl mx-auto rounded-xl shadow-lg bg-[#23272f] flex flex-col h-[calc(100vh-2rem)]">
        <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden w-full">
          {/* Left Side: Chat Messages */}
          <div className="flex flex-col w-1/2 min-w-0 h-full border-r border-[#2c2f36] bg-[#23272f]">
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              {chatMessages.length > 0 ? (
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className={`flex items-start ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.type === 'ai' && (
                        <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-black font-bold text-sm mr-3 flex-shrink-0">
                          AI
                        </div>
                      )}
                      <div className={`rounded-lg p-3 max-w-[80%] shadow-sm ${
                        message.type === 'user' 
                          ? 'bg-neon-cyan text-black' 
                          : 'bg-[#181c24] border border-[#444] text-[#e5e7ef]'
                      }`}>
                        <div className="text-sm whitespace-pre-line">{message.content}</div>
                      </div>
                      {message.type === 'user' && (
                        <div className="w-8 h-8 bg-[#666] rounded-full flex items-center justify-center text-white font-bold text-sm ml-3 flex-shrink-0">
                          U
                        </div>
                      )}
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-black font-bold text-sm mr-3 flex-shrink-0">
                        AI
                      </div>
                      <div className="bg-[#181c24] border border-[#444] rounded-lg p-3 max-w-[80%] shadow-sm">
                        <div className="text-[#00ffff] text-sm">Thinking...</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-[#888] text-lg">Chat Preview Coming Soon...</span>
                </div>
              )}
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
                onKeyDown={handleInputKeyDown}
                onFocus={handleInputFocus}
                disabled={isGenerating}
                autoFocus={!isRunning}
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
