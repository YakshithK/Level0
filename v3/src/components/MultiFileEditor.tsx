import { useState } from "react";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { FileCode, Palette, Globe } from "lucide-react";
import FileExplorer from "./FileExplorer";

interface GameFiles {
  [key: string]: string;
}

interface MultiFileEditorProps {
  files: GameFiles;
  onChange: (files: GameFiles) => void;
}

const MultiFileEditor = ({ files, onChange }: MultiFileEditorProps) => {
  const fileNames = Object.keys(files);
  const [activeFile, setActiveFile] = useState<string>(fileNames[0] || "index.html");

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.html')) return <Globe className="h-4 w-4" />;
    if (fileName.endsWith('.css')) return <Palette className="h-4 w-4" />;
    if (fileName.endsWith('.js')) return <FileCode className="h-4 w-4" />;
    return <FileCode className="h-4 w-4" />;
  };

  const getLanguageExtension = (fileName: string) => {
    if (fileName.endsWith('.html')) return [html()];
    if (fileName.endsWith('.css')) return [css()];
    if (fileName.endsWith('.js')) return [javascript()];
    return [javascript()];
  };

  const handleEditorChange = (value: string) => {
    onChange({
      ...files,
      [activeFile]: value,
    });
  };

  return (
    <div className="h-full flex bg-[#1e1e1e] rounded-xl border border-border overflow-hidden">
      {/* File Explorer Sidebar */}
      <div className="w-56 shrink-0">
        <FileExplorer 
          files={files} 
          activeFile={activeFile} 
          onFileSelect={setActiveFile}
        />
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab Bar */}
        <div className="flex items-center h-10 border-b border-[#2d2d2d] bg-[#252526] px-2">
          <div className="flex items-center gap-1 px-2">
            {getFileIcon(activeFile)}
            <span className="text-sm font-mono text-gray-300">{activeFile}</span>
          </div>
        </div>

        {/* CodeMirror Editor */}
        <div className="flex-1 overflow-auto">
          <CodeMirror
            value={files[activeFile] || ''}
            height="100%"
            theme="dark"
            extensions={getLanguageExtension(activeFile)}
            onChange={handleEditorChange}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              searchKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MultiFileEditor;
