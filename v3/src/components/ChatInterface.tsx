import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GameFiles {
  [key: string]: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  gameFiles?: GameFiles;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onRestoreVersion: (gameFiles: GameFiles) => void;
  isGenerating: boolean;
}

const ChatInterface = ({ messages, onSendMessage, onRestoreVersion, isGenerating }: ChatInterfaceProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input.trim() && !isGenerating) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleStop = () => {
    // TODO: Implement stop generation
    toast.info("Stop generation feature coming soon");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col glass-strong rounded-2xl border border-border/50 overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <h2 className="text-lg font-semibold gradient-text">Game Chat</h2>
        <p className="text-sm text-muted-foreground">
          Describe your game or request changes
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4 animate-fade-in">
              <div className="text-5xl animate-float">🎮</div>
              <div>
                <h3 className="text-lg font-semibold gradient-text mb-2">Start Creating!</h3>
                <p className="text-sm text-muted-foreground">
                  Describe your game, then refine it
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Create a simple Snake game")}
                  className="text-left justify-start glass hover:glass-strong glow-hover border-border/50"
                >
                  🐍 Snake game
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Make a Pong game with smooth animations")}
                  className="text-left justify-start glass hover:glass-strong glow-hover border-border/50"
                >
                  🏓 Pong game
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Create a Flappy Bird clone")}
                  className="text-left justify-start glass hover:glass-strong glow-hover border-border/50"
                >
                  🐦 Flappy Bird
                </Button>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const assistantMessagesWithFiles = messages
                .slice(0, index + 1)
                .filter(m => m.role === "assistant" && m.gameFiles);
              const showRestore = message.role === "assistant" && 
                                  message.gameFiles && 
                                  assistantMessagesWithFiles.length > 1;
              
              return (
                <div
                  key={index}
                  className={`flex animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 smooth-transition ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)]"
                        : "glass-strong"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {showRestore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onRestoreVersion(message.gameFiles!);
                          toast.success("Game restored to this version!");
                        }}
                        className="mt-2 h-7 text-xs hover:bg-accent/20 smooth-transition"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore this version
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {isGenerating && (
            <div className="flex justify-start animate-fade-in">
              <div className="glass-strong rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <p className="text-sm">Generating...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your game or request changes..."
            className="flex-1 min-h-[64px] max-h-[120px] resize-none glass-strong border-border/50 focus:border-accent/50 smooth-transition rounded-xl"
            disabled={isGenerating}
          />
          <Button
            onClick={isGenerating ? handleStop : handleSubmit}
            disabled={!isGenerating && !input.trim()}
            size="icon"
            className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-accent hover:opacity-90 glow-primary smooth-transition"
          >
            {isGenerating ? (
              <Square className="h-5 w-5 fill-current" />
            ) : (
              <Send className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
