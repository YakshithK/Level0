import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const PromptInput = ({ onGenerate, isGenerating }: PromptInputProps) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const examplePrompts = [
    "classic snake game",
    "flappy bird clone",
    "space invaders",
    "brick breaker",
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the game you want to create... (e.g., 'a classic snake game with neon graphics')"
          className="min-h-[120px] text-base bg-card border-border focus-visible:ring-primary resize-none pr-24"
          disabled={isGenerating}
        />
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          className="absolute bottom-3 right-3 bg-primary hover:bg-primary/90 glow-primary"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </>
          )}
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Try:</span>
        {examplePrompts.map((example) => (
          <Button
            key={example}
            variant="outline"
            size="sm"
            onClick={() => setPrompt(example)}
            disabled={isGenerating}
            className="text-xs"
          >
            {example}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PromptInput;
