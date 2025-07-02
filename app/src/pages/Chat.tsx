import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import '../App.css';
import { PhaserGame } from '../components/PhaserGames';
import Editor from "@monaco-editor/react";
import { anthropicService } from '../services/anthropicService';
import { supabase } from '../lib/utils';
import { User } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  code?: string;
  timestamp: Date;
}

export default function Chat() {
  const { projectId } = useParams();
  const navigate = useNavigate();


  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [phaserCode, setPhaserCode] = useState<string>('');
  const [showCode, setShowCode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingProject, setLoadingProject] = useState<boolean>(!!projectId);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [projectName, setProjectName] = useState<string>('My_Phaser_Game');
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);

  // Auth check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  // Load project and chat messages
  const fetchProjectAndMessages = async () => {
    if (!projectId) {
      setLoadingProject(false);
      return;
    }
    setLoadingProject(true);
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (projectError || !project) {
      setError('Project not found.');
      setLoadingProject(false);
      return;
    }
    setPhaserCode(project.code || '');
    setProjectName(project.name || 'My_Phaser_Game');
    setDeployUrl(project.deployment_url || null);
    // Fetch chat messages
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('connection_id', projectId)
      .order('created_at', { ascending: true });
    if (msgError) {
      setError('Failed to load chat messages.');
      setLoadingProject(false);
      return;
    }
    const chatMsgs: ChatMessage[] = (messages || []).map((msg: any) => ({
      id: msg.id,
      type: msg.sender,
      content: msg.message,
      timestamp: new Date(msg.created_at)
    }));
    setChatMessages(chatMsgs);
    setLoadingProject(false);
  };

  useEffect(() => {
    fetchProjectAndMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Canvas focus effect
  useEffect(() => {
    if (!showCode && isRunning) {
      const timer = setTimeout(focusPhaserCanvas, 100);
      return () => clearTimeout(timer);
    }
  }, [showCode, isRunning]);

  if (user === undefined || loadingProject) {
    return <div className="min-h-screen flex items-center justify-center bg-[#181c24] text-[#e5e7ef]"><span>Loading...</span></div>;
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Send message and always refetch
  const handleInitialPrompt = async () => {
    if (!aiPrompt.trim() || !projectId) return;
    setIsGenerating(true);
    setError(null);
    // Save user message
    await supabase.from('chat_messages').insert([
      {
        connection_id: projectId,
        sender: 'user',
        message: aiPrompt
      }
    ]);
    // Get conversation history for AI
    const conversationHistory = chatMessages.map(msg => ({
      type: msg.type,
      content: msg.content + (msg.code ? `\n${msg.code}` : '')
    })).concat({ type: 'user', content: aiPrompt });
    setAiPrompt('');
    try {
      const result = await anthropicService.generatePhaserScene(aiPrompt, false, conversationHistory);
      if (result && result.code && result.code.trim()) {
        setPhaserCode(result.code);
        // Save AI message
        await supabase.from('chat_messages').insert([
          {
            connection_id: projectId,
            sender: 'ai',
            message: result.thinking || ''
          }
        ]);
        // Update project code
        await supabase.from('projects').update({ code: result.code }).eq('id', projectId);
      } else {
        setError('No code was generated.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      await fetchProjectAndMessages();
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

  const handleInputFocus = () => {};

  // Download handler
  const handleDownloadCode = async () => {
    // Fetch the Phaser template
    const response = await fetch('/phaser_template.html');
    let template = await response.text();
    // Replace USER_CODE
    const htmlContent = template.replace('{{USER_CODE}}', phaserCode || '');
    // Format filename
    const safeName = (projectName || 'My_Phaser_Game').replace(/\s+/g, '_');
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke('deploy_game', {
        body: { userCode: phaserCode }
      });
      if (error || !data || !data.url) {
        setDeployUrl(null);
        alert('Deployment failed!');
      } else {
        setDeployUrl(data.url);
        if (projectId) {
          const { error: updateError } = await supabase
            .from('projects')
            .update({ deployment_url: data.url })
            .eq('id', projectId);
          if (updateError) {
            alert('Failed to save deployment URL!');
          } else {
            await fetchProjectAndMessages();
          }
        }
      }
    } catch (err) {
      setDeployUrl(null);
      alert('Deployment failed!');
    }
    setDeploying(false);
  };

  return (
    <div
      className="min-h-screen bg-[#181c24] text-[#e5e7ef] flex items-center justify-center p-4"
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="w-full max-w-7xl mx-auto rounded-xl shadow-lg bg-[#23272f] flex flex-col h-[calc(100vh-2rem)]">
        {/* Header with back button */}
        <div className="flex items-center justify-between p-4 border-b border-[#2c2f36] bg-[#23272f] flex-shrink-0">
          <button
            onClick={() => navigate('/projects')}
            className="bg-[#444] text-white px-4 py-2 rounded-lg hover:bg-[#555] transition-colors flex items-center gap-2"
          >
            ← Back to Projects
          </button>
          <h1 className="text-lg font-semibold">Game Chat</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
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
              <textarea
                ref={textareaRef}
                className="w-full px-4 py-2 rounded border border-[#444] bg-[#181c24] text-white text-base focus:outline-none focus:border-[#00ffff] resize-none overflow-y-auto min-h-[44px] max-h-40"
                placeholder="Type your game prompt and press Enter..."
                value={aiPrompt}
                onChange={e => {
                  setAiPrompt(e.target.value);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleInitialPrompt();
                  }
                }}
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
                    <button
                      onClick={handleDownloadCode}
                      className="bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Download Code
                    </button>
                  </div>
                </div>
                {/* Deploy button logic */}
                {deployUrl ? (
                  <button
                    onClick={() => window.open(deployUrl, '_blank')}
                    className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Already Deployed (Open)
                  </button>
                ) : (
                  <button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="ml-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {deploying ? 'Deploying...' : 'Deploy Game'}
                  </button>
                )}
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