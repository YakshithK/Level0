import MonacoEditor from "../components/MonacoEditor";
import FileExplorer from "../components/FileExplorer";
import PromptInput from "../components/PromptInput";
import React, { useState, useEffect } from "react";

export default function Result() {
  // For demo, just show a static diff preview
  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Diff Preview</h1>
      <pre className="bg-gray-900 text-green-400 p-4 rounded w-2/3 overflow-auto">
        + Added line
        - Removed line
      </pre>
      <a href="/" className="mt-4 text-blue-500 underline">Back to Editor</a>
    </div>
  );
}
