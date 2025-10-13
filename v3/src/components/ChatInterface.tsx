import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, RotateCcw } from "lucide-react";
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold">Game Chat</h2>
        <p className="text-sm text-muted-foreground">
          Describe your game or request changes
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-4xl">🎮</div>
              <div>
                <h3 className="text-base font-semibold mb-1">Start Creating!</h3>
                <p className="text-xs text-muted-foreground">
                  Describe your game, then refine it
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Create a simple Snake game")}
                  className="text-left justify-start text-xs h-8"
                >
                  Snake game
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Make a Pong game with smooth animations")}
                  className="text-left justify-start text-xs h-8"
                >
                  Pong game
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Create a Flappy Bird clone")}
                  className="text-left justify-start text-xs h-8"
                >
                  Flappy Bird
                </Button>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              // Count how many assistant messages with gameFiles exist before this one
              const assistantMessagesWithFiles = messages
                .slice(0, index + 1)
                .filter(m => m.role === "assistant" && m.gameFiles);
              const showRestore = message.role === "assistant" && 
                                  message.gameFiles && 
                                  assistantMessagesWithFiles.length > 1;
              
              return (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
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
                        className="mt-2 h-7 text-xs"
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
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm">Generating...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your game or request changes..."
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={isGenerating}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
