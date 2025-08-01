import React from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface PlanStep {
  step: string;
  completed: boolean;
  isActive: boolean;
}

interface ChatPanelProps {
  messages: Message[];
  planSteps: PlanStep[];
  currentPrompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isProcessing: boolean;
  selectedModel: "openai" | "kimi";
  onModelChange: (model: "openai" | "kimi") => void;
}

export default function ChatPanel({
  messages,
  planSteps,
  currentPrompt,
  onPromptChange,
  onSubmit,
  onStop,
  isProcessing,
  selectedModel,
  onModelChange
}: ChatPanelProps) {
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
              <p className="text-xs text-gray-400">Ready to help you code</p>
            </div>
          </div>
          
          {/* Model Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-xs text-gray-400">Model:</label>
            <select 
              value={selectedModel} 
              onChange={(e) => onModelChange(e.target.value as "openai" | "kimi")}
              className="bg-gray-800 border border-gray-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="openai">GPT-4O</option>
              <option value="kimi">Kimi K2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">Start a conversation with your AI assistant</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Plan Steps */}
      {planSteps.length > 0 && (
        <div className="p-4 border-t border-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Execution Plan</h3>
            {isProcessing && (
              <button
                onClick={onStop}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
              >
                Stop
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {planSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 p-2 rounded text-xs ${
                  step.completed
                    ? 'bg-green-900/30 border-l-2 border-green-500'
                    : step.isActive
                    ? 'bg-blue-900/30 border-l-2 border-blue-500'
                    : 'bg-gray-800/50 border-l-2 border-gray-600'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {step.completed ? (
                    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : step.isActive ? (
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  )}
                </div>
                <span className={step.completed ? 'text-green-400' : step.isActive ? 'text-blue-400' : 'text-gray-400'}>
                  {step.step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isProcessing) {
                onSubmit();
              }
            }}
            placeholder="Describe what you want to build..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
            disabled={isProcessing}
          />
          <button
            onClick={onSubmit}
            disabled={!currentPrompt.trim() || isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Working...</span>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { Message, PlanStep };
