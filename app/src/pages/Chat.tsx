import { useState } from 'react';
import '../App.css'
import { PhaserGame } from '../components/PhaserGames';

export default function Chat() {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="min-h-screen bg-[#181c24] text-[#e5e7ef] flex items-center justify-center">
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
              <form className="flex gap-1" onSubmit={e => e.preventDefault()}>
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
            <div className="flex-1 p-2 flex flex-col min-h-0 min-w-0">
              <span className="block mb-1 font-semibold text-sm">Game Preview</span>
              <PhaserGame />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
