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
}

export default function ChatPanel({
  messages,
  planSteps,
  currentPrompt,
  onPromptChange,
  onSubmit,
  onStop,
  isProcessing
}: ChatPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-96 bg-gray-900 border-r border-gray-700 flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
            <p className="text-xs text-gray-400">Ready to help you code</p>
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
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}

        {/* Plan Steps */}
        {planSteps.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-sm font-semibold text-white">Execution Plan</h3>
            </div>
            <div className="space-y-2">
              {planSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                    step.completed 
                      ? 'bg-green-600' 
                      : step.isActive 
                      ? 'bg-blue-600' 
                      : 'bg-gray-600'
                  }`}>
                    {step.completed ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.isActive ? (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                  <div className={`text-xs ${step.completed ? 'text-gray-400 line-through' : step.isActive ? 'text-white' : 'text-gray-500'}`}>
                    {step.step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center space-x-2 text-blue-400 bg-gray-800 rounded-lg p-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm">AI is thinking...</span>
            <button
              onClick={onStop}
              className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="relative">
          <textarea
            value={currentPrompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build or modify..."
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
            rows={3}
            disabled={isProcessing}
          />
          <button
            onClick={onSubmit}
            disabled={isProcessing || !currentPrompt.trim()}
            className="absolute bottom-3 right-3 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

export type { Message, PlanStep };
