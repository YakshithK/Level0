"use client";

import MonacoEditor from "../components/MonacoEditor";
import FileExplorer from "../components/FileExplorer";
import PromptInput from "../components/PromptInput";
import PlanTracker from "../components/PlanTracker";
import DiffViewer from "../components/DiffViewer";
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
  const [pendingDiff, setPendingDiff] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<string>("");

  useEffect(() => {
    setFileContent(fileMap[selectedFile] || "");
  }, [selectedFile]);

  const handlePromptSubmit = async () => {
    console.log("[UI] User submitted prompt:", prompt);
    const res = await fetch("/api/retrieve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, topK: 5 })
    });
    const relevantChunks = await res.json();
    console.log("[UI] Retrieved relevantChunks:", relevantChunks);
    const smartPrompt = `User request: ${prompt}\n\nRelevant files:` + relevantChunks.map((c: any) => `\n--- ${c.file} ---\n${c.code}\n`).join("");
    console.log("[UI] Smart prompt:", smartPrompt);
    alert(smartPrompt);
    // Use the /api/plan endpoint for planning
    try {
      const planRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const steps = await planRes.json();
      console.log("[UI] Plan steps:", steps);
      setPlan(Array.isArray(steps) ? steps : ["Plan API did not return an array."]);
      setCurrentStep(0);
    } catch (e) {
      console.log("[UI] Plan API error:", e);
      setPlan(["Failed to fetch plan from API."]);
      setCurrentStep(0);
    }
    console.log("[UI] Plan state after submit:", plan);
  };

  // When a plan is generated, execute each step in order
  useEffect(() => {
    async function runPlan() {
      if (plan.length > 0) {
        for (let i = 0; i < plan.length; i++) {
          setCurrentStep(i);
          const step = plan[i] as any;
          const task = typeof step === 'object' ? step.instruction || step.description || step.step || JSON.stringify(step) : step;
          console.log(`[UI] Executing plan step ${i + 1}:`, task);
          // Run executor agent for each step
          const res = await fetch("/api/execute-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task })
          });
          const result = await res.json();
          console.log(`[UI] Executor result for step ${i + 1}:`, result);
          setPendingDiff(result);
          setPendingFile(result.mainFile);
          // Show the updated file in Monaco if the selected file matches
          if (selectedFile === result.mainFile) {
            setFileContent(result.updated);
          }
          // Wait for user to accept before continuing
          return;
        }
      }
    }
    runPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const handleAccept = async () => {
    if (!pendingDiff) return;
    console.log("[UI] User accepted change for file:", pendingDiff.mainFile);
    await fetch("/api/apply-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: pendingDiff.mainFile, content: pendingDiff.updated })
    });
    // Mark step as completed and move to next
    setPendingDiff(null);
    setPendingFile("");
    setPlan((prev) => prev.map((step, idx) => idx === currentStep ? (typeof step === 'object' ? { ...step, completed: true } : step) : step));
    setCurrentStep((prev) => prev + 1);
    console.log("[UI] Plan state after accept:", plan);
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
        {pendingDiff && (
          <div className="mt-4">
            <div className="mb-2 font-semibold">Review the change below and accept to apply:</div>
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded" onClick={handleAccept}>
              Accept Change
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
