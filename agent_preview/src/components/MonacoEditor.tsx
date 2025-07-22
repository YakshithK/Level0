import React from "react";
import Editor from "@monaco-editor/react";

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ value, language, onChange }) => {
  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{ fontSize: 16 }}
    />
  );
};

export default MonacoEditor;
