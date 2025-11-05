import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useGamePersistence } from "@/hooks/useGamePersistence";
import ChatInterface from "@/components/ChatInterface";
import MultiFileEditor from "@/components/MultiFileEditor";
import GamePreview from "@/components/GamePreview";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Code, Eye, Upload, Home, Save, LogOut } from "lucide-react";
import ItchPublisher from "@/components/ItchPublisher";

interface Message {
  role: "user" | "assistant";
  content: string;
  gameFiles?: GameFiles;
}

interface GameFiles {
  [key: string]: string;
}

const Index = () => {
  const [gameFiles, setGameFiles] = useState<GameFiles>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [showItchPublisher, setShowItchPublisher] = useState(false);
  const [gameTitle, setGameTitle] = useState("New Game");
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixAttempts, setAutoFixAttempts] = useState(0);
  const maxAutoFixAttempts = 3;

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const gameIdFromUrl = searchParams.get('gameId');
  const { currentGameId, saveGame, loadGame, saveChatMessage, loadChatMessages } = useGamePersistence(gameIdFromUrl);

  // Load game data if gameId is provided
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const loadGameData = async () => {
      if (gameIdFromUrl) {
        const game = await loadGame(gameIdFromUrl);
        if (game) {
          setGameTitle(game.title);
          setGameFiles(game.current_files as GameFiles || {});
          
          const chatHistory = await loadChatMessages(gameIdFromUrl);
          setMessages(chatHistory);
        }
      } else if (location.state?.initialIdea && messages.length === 0) {
        // New game from landing page - only run if no messages yet
        const idea = location.state.initialIdea;
        handleSendMessage(idea);
        // Clear the location state to prevent re-running
        window.history.replaceState({}, document.title);
      }
    };

    loadGameData();
  }, [user, gameIdFromUrl, navigate]);

  // Auto-save game when files change
  useEffect(() => {
    if (user && Object.keys(gameFiles).length > 0 && currentGameId) {
      const autoSave = async () => {
        await saveGame(gameTitle, gameFiles);
      };
      
      const timeoutId = setTimeout(autoSave, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [gameFiles, gameTitle, user, currentGameId]);

  const handleSendMessage = async (userMessage: string, isAutoFix: boolean = false) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsGenerating(true);
    
    if (isAutoFix) {
      setIsAutoFixing(true);
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke('generate-game', {
        body: { 
          prompt: userMessage,
          conversationHistory: messages
        }
      });

      if (error) throw error;

      if (data?.files) {
        const assistantMessage = { 
          role: "assistant" as const, 
          content: data.response || "Game updated successfully!",
          gameFiles: data.files
        };
        
        setGameFiles(data.files);
        setMessages([...newMessages, assistantMessage]);
        
        // Update game title from AI response if provided
        if (data.gameTitle && gameTitle === "New Game") {
          setGameTitle(data.gameTitle);
        }

        // Save to database
        let gId = currentGameId;
        if (!gId && user) {
          // Create new game if this is the first message
          const initialIdea = messages.length === 0 ? userMessage : undefined;
          gId = await saveGame(gameTitle, data.files, initialIdea, userMessage.substring(0, 200));
        }

        if (gId && user) {
          // Save chat messages
          await saveChatMessage(gId, 'user', userMessage);
          await saveChatMessage(gId, 'assistant', assistantMessage.content, data.files);
        }

        // Reset auto-fix attempts on successful generation
        if (isAutoFix) {
          setAutoFixAttempts(0);
          toast.success("Error fixed successfully!");
        } else {
          toast.success("Game updated!");
        }
      } else {
        throw new Error("No game files received");
      }
    } catch (error) {
      console.error('Error generating game:', error);
      toast.error("Failed to generate game. Please try again.");
    } finally {
      setIsGenerating(false);
      if (isAutoFix) {
        setIsAutoFixing(false);
      }
    }
  };

  const handleRuntimeError = async (error: Error) => {
    // Only auto-fix if we haven't exceeded max attempts
    if (autoFixAttempts >= maxAutoFixAttempts) {
      toast.error(`Auto-fix failed after ${maxAutoFixAttempts} attempts. Please describe the issue manually.`);
      setAutoFixAttempts(0);
      return;
    }

    setAutoFixAttempts(prev => prev + 1);
    
    // Create error context message
    const errorMessage = `RUNTIME ERROR DETECTED:
Error: ${error.message}
Stack: ${error.stack || 'No stack trace'}

Please fix this error in the game code. Analyze the error and update the relevant files to resolve it.`;
    
    toast.info(`Auto-fixing error (attempt ${autoFixAttempts + 1}/${maxAutoFixAttempts})...`);
    
    // Send error back to AI for fixing
    await handleSendMessage(errorMessage, true);
  };

  const handleValidationErrors = async (errors: any[]) => {
    // Only auto-fix if we haven't exceeded max attempts
    if (autoFixAttempts >= maxAutoFixAttempts) {
      toast.error(`Auto-fix failed after ${maxAutoFixAttempts} attempts. Please describe the issue manually.`);
      setAutoFixAttempts(0);
      return;
    }

    setAutoFixAttempts(prev => prev + 1);
    
    // Create validation error context
    const errorDetails = errors.map(e => 
      `- ${e.type.toUpperCase()}: ${e.message}${e.file ? ` in ${e.file}` : ''}${e.line ? ` at line ${e.line}` : ''}`
    ).join('\n');
    
    const errorMessage = `VALIDATION ERRORS DETECTED:\n${errorDetails}\n\nPlease fix these errors in the game code.`;
    
    toast.info(`Auto-fixing validation errors (attempt ${autoFixAttempts + 1}/${maxAutoFixAttempts})...`);
    
    // Send errors back to AI for fixing
    await handleSendMessage(errorMessage, true);
  };

  // Reset auto-fix attempts when user manually sends a message
  const handleUserMessage = (message: string) => {
    setAutoFixAttempts(0);
    handleSendMessage(message, false);
  };

  const handleManualSave = async () => {
    if (!user) {
      toast.error("Please sign in to save");
      return;
    }

    setIsSaving(true);
    try {
      const gId = await saveGame(gameTitle, gameFiles, undefined, "Manual save");
      if (gId) {
        toast.success("Game saved successfully!");
      }
    } catch (error) {
      toast.error("Failed to save game");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="h-screen bg-background flex flex-col relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 glass-strong border-b border-primary/20 shrink-0">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent ml-2">
              {gameTitle}
            </h1>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="glass border-primary/20 hover:border-accent/60"
              >
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualSave}
                disabled={!user || Object.keys(gameFiles).length === 0 || isSaving}
                className="glass border-primary/20 hover:border-accent/60"
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="glass border-primary/20 hover:border-accent/60"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - fills remaining space */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Chat Panel */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full p-4 md:p-6">
              <ChatInterface
                messages={messages}
                onSendMessage={handleUserMessage}
                onRestoreVersion={setGameFiles}
                isGenerating={isGenerating}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-gradient-to-b from-primary/50 to-accent/50 w-[2px]" />

          {/* Code/Preview Panel */}
          <ResizablePanel defaultSize={65} minSize={35}>
            <div className="h-full flex flex-col">
              {/* Top Control Bar */}
              <div className="shrink-0 p-4 md:p-6 pb-3">
                <div className="flex gap-3 justify-between items-center">
                  <div className="flex gap-2 p-1 rounded-xl glass">
                    <Button
                      variant={showPreview ? "ghost" : "default"}
                      size="sm"
                      onClick={() => setShowPreview(false)}
                      className={`flex items-center gap-2 rounded-lg smooth-transition ${
                        !showPreview ? 'bg-gradient-to-r from-primary to-accent glow-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Code className="h-4 w-4" />
                      <span className="hidden sm:inline">Code</span>
                    </Button>
                    <Button
                      variant={showPreview ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setShowPreview(true)}
                      className={`flex items-center gap-2 rounded-lg smooth-transition ${
                        showPreview ? 'bg-gradient-to-r from-primary to-accent glow-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowItchPublisher(true)}
                    disabled={Object.keys(gameFiles).length === 0}
                    className="flex items-center gap-2 glass border-accent/30 hover:border-accent/60 hover:bg-accent/10 glow-hover"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Publish</span>
                  </Button>
                </div>
              </div>

              {/* Content - fills remaining space */}
              <div className="flex-1 overflow-hidden px-4 md:px-6 pb-4 md:pb-6">
                <div className="h-full animate-fade-in">
                  {showPreview ? (
                    <GamePreview 
                      gameFiles={gameFiles} 
                      onRuntimeError={handleRuntimeError}
                      onValidationErrors={handleValidationErrors}
                    />
                  ) : (
                    <MultiFileEditor files={gameFiles} onChange={setGameFiles} />
                  )}
                </div>
              </div>

              {/* Status Footer Bar */}
              <div className="shrink-0 glass-strong border-t border-border/50 px-4 md:px-6 py-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${Object.keys(gameFiles).length > 0 ? 'bg-accent animate-glow-pulse' : 'bg-muted'}`} />
                      <span className="text-muted-foreground">
                        {Object.keys(gameFiles).length > 0 
                          ? `${Object.keys(gameFiles).length} files` 
                          : 'No files loaded'}
                      </span>
                    </div>
                    {Object.keys(gameFiles).length > 0 && (
                      <div className="hidden md:flex items-center gap-2 text-muted-foreground">
                        <span>•</span>
                        <span>{showPreview ? 'Preview Mode' : 'Edit Mode'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {isAutoFixing && (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-glow-pulse" />
                        <span className="hidden sm:inline">Auto-fixing ({autoFixAttempts}/{maxAutoFixAttempts})...</span>
                      </div>
                    )}
                    {isGenerating && !isAutoFixing && (
                      <div className="flex items-center gap-2 text-accent">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
                        <span className="hidden sm:inline">Generating...</span>
                      </div>
                    )}
                     <div className="text-muted-foreground hidden md:inline">
                      Level0 v1.0
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <ItchPublisher
        gameFiles={gameFiles}
        isOpen={showItchPublisher}
        onClose={() => setShowItchPublisher(false)}
      />
    </div>
  );
};

export default Index;
