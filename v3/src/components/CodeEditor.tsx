import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

const CodeEditor = ({ code, onChange }: CodeEditorProps) => {
  return (
    <div className="h-full flex flex-col bg-[hsl(var(--editor-bg))] rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-sm text-muted-foreground ml-2">game.html</span>
      </div>
      <Textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono text-sm bg-transparent border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
        placeholder="// Your game code will appear here..."
      />
    </div>
  );
};

export default CodeEditor;
