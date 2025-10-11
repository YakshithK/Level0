import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatInterface from "@/components/ChatInterface";
import MultiFileEditor from "@/components/MultiFileEditor";
import GamePreview from "@/components/GamePreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Code, Eye } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GameFiles {
  [key: string]: string;
}

const Index = () => {
  const [gameFiles, setGameFiles] = useState<GameFiles>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  const handleSendMessage = async (userMessage: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-game', {
        body: { 
          prompt: userMessage,
          conversationHistory: messages
        }
      });

      if (error) throw error;

      if (data?.files) {
        setGameFiles(data.files);
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.response || "Game updated successfully!" }
        ]);
        toast.success("Game updated!");
      } else {
        throw new Error("No game files received");
      }
    } catch (error) {
      console.error('Error generating game:', error);
      toast.error("Failed to generate game. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold gradient-text">
              GameForge AI
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Powered by</span>
              <span className="font-semibold text-primary">Groq + Llama 3.3</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-73px)]">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          {/* Chat Panel */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <div className="h-full p-6">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isGenerating={isGenerating}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Code/Preview Panel */}
          <ResizablePanel defaultSize={65} minSize={35}>
            <div className="h-full p-6 flex flex-col">
              {/* Toggle Buttons */}
              <div className="mb-4 flex gap-2">
                <Button
                  variant={showPreview ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  Code Editor
                </Button>
                <Button
                  variant={showPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Live Preview
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0">
                {showPreview ? (
                  <GamePreview gameFiles={gameFiles} />
                ) : (
                  <MultiFileEditor files={gameFiles} onChange={setGameFiles} />
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default Index;
