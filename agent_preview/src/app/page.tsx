"use client";

import MonacoEditor from "../components/MonacoEditor";
import FileExplorer from "../components/FileExplorer";
import PromptInput from "../components/PromptInput";
import PlanTracker from "../components/PlanTracker";
import React, { useState, useEffect } from "react";
import { retrieveRelevantChunks } from "../../retriever";
import { buildPrompt } from "../../promptBuilder";
import { pipeline } from '@xenova/transformers';

const fileMap: Record<string, string> = {
  "example-project/hello.ts": `// Example file for the file explorer and Monaco editor demo\nexport const hello = () => {\n  return "Hello, world!";\n};`
};

export default function Home() {
  const [fileContent, setFileContent] = useState<string>(fileMap["example-project/hello.ts"]);
  const [selectedFile, setSelectedFile] = useState<string>("example-project/hello.ts");
  const [prompt, setPrompt] = useState<string>("");
  const [plan, setPlan] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    setFileContent(fileMap[selectedFile] || "");
  }, [selectedFile]);

  const handlePromptSubmit = async () => {
    const res = await fetch("/api/retrieve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, topK: 5 })
    });
    const relevantChunks = await res.json();
    const smartPrompt = `User request: ${prompt}\n\nRelevant files:` + relevantChunks.map((c: any) => `\n--- ${c.file} ---\n${c.code}\n`).join("");
    console.log(smartPrompt);
    alert(smartPrompt);
    // Use the /api/plan endpoint for planning
    try {
      const planRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const steps = await planRes.json();
      setPlan(Array.isArray(steps) ? steps : ["Plan API did not return an array."]);
      setCurrentStep(0);
    } catch (e) {
      setPlan(["Failed to fetch plan from API."]);
      setCurrentStep(0);
    }
    console.log(plan);
  };

  return (
    <div className="flex h-screen">
      <FileExplorer onSelect={setSelectedFile} />
      <main className="flex-1 flex flex-col">
        <div className="flex-1">
          <MonacoEditor
            value={fileContent}
            language="typescript"
            onChange={value => setFileContent(value ?? "")}
          />
        </div>
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          onSubmit={handlePromptSubmit}
        />
        <PlanTracker steps={plan} currentStep={currentStep} />
      </main>
    </div>
  );
}
