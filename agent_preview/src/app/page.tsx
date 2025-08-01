"use client";

import React, { useState, useEffect } from "react";
import ChatPanel from "../components/ChatPanel";
import RightPanel from "../components/RightPanel";
import type { Message, PlanStep } from "../components/ChatPanel";

export default function Home() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<"openai" | "kimi">("openai");
  const [ragEnabled, setRagEnabled] = useState<boolean>(true);
  
  // File management
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [changeCounter, setChangeCounter] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Diff management - now supports multiple pending diffs
  const [pendingDiffs, setPendingDiffs] = useState<any[]>([]);

  // Load first available file on startup
  useEffect(() => {
    async function loadFirstFile() {
      try {
        const res = await fetch("/api/files");
        if (res.ok) {
          const files = await res.json();
          if (files.length > 0) {
            // Find the first TypeScript/JavaScript file, or just use the first file
            const firstCodeFile = files.find((f: any) => 
              f.name.endsWith('.ts') || f.name.endsWith('.js') || f.name.endsWith('.tsx') || f.name.endsWith('.jsx')
            );
            const fileToSelect = firstCodeFile || files[0];
            setSelectedFile(fileToSelect.path);
          }
        }
      } catch (error) {
        console.error("Failed to load initial file list:", error);
      }
    }
    
    if (!selectedFile) {
      loadFirstFile();
    }
  }, [selectedFile]);

  // Load initial file
  useEffect(() => {
    async function fetchFile() {
      if (selectedFile) {
        const res = await fetch(`/api/files?file=${encodeURIComponent(selectedFile)}`);
        if (res.ok) {
          const data = await res.json();
          setFileContent(data.content ?? "");
        } else {
          setFileContent("");
        }
      }
    }
    fetchFile();
  }, [selectedFile]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (selectedFile) {
      const res = await fetch(`/api/files?file=${encodeURIComponent(selectedFile)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content ?? "");
        setChangeCounter((prev) => prev + 1);
      }
    }
  };

  // Chat submission handler
  const handlePromptSubmit = async () => {
    if (!currentPrompt.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentPrompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setError("");
    setIsProcessing(true);
    setIsStopped(false); // Reset stop flag for new execution
    
    try {
      // Add system message about planning
      const planningMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Analyzing your request and creating execution plan...',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, planningMessage]);

      // Get plan from API
      const planRes = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentPrompt })
      });
      
      if (!planRes.ok) {
        throw new Error(`Plan API returned ${planRes.status}`);
      }
      
      const steps = await planRes.json();
      console.log("[UI] Plan steps:", steps);
      
      // Convert plan to PlanStep format
      const formattedSteps: PlanStep[] = Array.isArray(steps) 
        ? steps.map((step, index) => ({
            step: typeof step === 'object' ? step.instruction || step.description || step.step || JSON.stringify(step) : step,
            completed: false,
            isActive: index === 0
          }))
        : [{ step: "Failed to generate plan", completed: false, isActive: false }];

      setPlanSteps(formattedSteps);
      setCurrentStep(0);

      // Add assistant confirmation
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `I've created a ${formattedSteps.length}-step plan to implement your request. I'll now execute each step and show you the changes for review.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (e) {
      console.error("[UI] Plan API error:", e);
      setError("Failed to generate plan. Please check your API configuration and try again.");
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'system',
        content: 'Failed to generate execution plan. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setCurrentPrompt("");
    }
  };

  // Stop execution handler
  const handleStop = () => {
    setIsStopped(true);
    setIsProcessing(false);
    
    const stopMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: 'Execution stopped by user.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, stopMessage]);
  };

  // Execute plan steps - modified to continue without waiting for user acceptance
  useEffect(() => {
    async function runStep() {
      if (planSteps.length > 0 && currentStep < planSteps.length && !isProcessing && !isStopped) {
        setIsProcessing(true);
        setError("");
        
        // Update current step as active
        setPlanSteps(prev => prev.map((step, index) => ({
          ...step,
          isActive: index === currentStep
        })));

        const step = planSteps[currentStep];
        console.log(`[UI] Executing plan step ${currentStep + 1}:`, step.step);
        
        try {
          const res = await fetch("/api/execute-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task: step.step, model: selectedModel, ragEnabled })
          });
          
          if (!res.ok) {
            throw new Error(`Execute task API returned ${res.status}`);
          }
          
          const result = await res.json();
          console.log(`[UI] Executor result for step ${currentStep + 1}:`, result);
          
          // Handle new multi-file format
          if (result.modifiedFiles && Array.isArray(result.modifiedFiles)) {
            // Process each modified file
            result.modifiedFiles.forEach((fileResult: any) => {
              // Check for generation errors
              if (!fileResult.updated || fileResult.updated.trim() === "") {
                fileResult.error = "Generated code is empty or invalid";
              }
              
              // Add to pending diffs queue with mainFile property for compatibility
              setPendingDiffs(prev => [...prev, { 
                ...fileResult, 
                mainFile: fileResult.file, // Add mainFile for backward compatibility
                stepIndex: currentStep 
              }]);
              
              // Show the updated file in Monaco if the selected file matches
              if (selectedFile === fileResult.file) {
                setFileContent(fileResult.updated);
              }
            });
          } else {
            // Handle legacy single-file format (fallback)
            // Check for generation errors
            if (!result.updated || result.updated.trim() === "") {
              result.error = "Generated code is empty or invalid";
            }
            
            // Add to pending diffs queue
            setPendingDiffs(prev => [...prev, { ...result, stepIndex: currentStep }]);
            
            // Show the updated file in Monaco if the selected file matches
            if (selectedFile === result.mainFile) {
              setFileContent(result.updated);
            }
          }

          // Mark step as completed and move to next immediately
          setPlanSteps(prev => prev.map((step, index) => 
            index === currentStep 
              ? { ...step, completed: true, isActive: false }
              : step
          ));

          // Add step completion message
          const stepMessage: Message = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `Step ${currentStep + 1} completed and queued for review. Continuing to next step...`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, stepMessage]);

          // Move to next step automatically
          setCurrentStep(prev => prev + 1);
          
        } catch (error) {
          console.error(`[UI] Error executing step ${currentStep + 1}:`, error);
          setError(`Failed to execute step ${currentStep + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          const errorMessage: Message = {
            id: Date.now().toString(),
            type: 'system',
            content: `Error executing step ${currentStep + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsProcessing(false);
        }
      }
    }
    runStep();
  }, [planSteps, currentStep, isProcessing, isStopped, selectedFile]);

  // Handle accepting individual changes
  const handleAccept = async (index?: number) => {
    const diffIndex = index ?? 0;
    const diff = pendingDiffs[diffIndex];
    if (!diff) return;
    
    setIsProcessing(true);
    setError("");
    
    try {
      console.log("[UI] User accepted change for file:", diff.mainFile);
      
      const response = await fetch("/api/apply-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: diff.mainFile, content: diff.updated })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to apply changes: ${response.status}`);
      }
      
      // Remove the applied diff from pending diffs
      setPendingDiffs(prev => prev.filter((_, i) => i !== diffIndex));
      
      const acceptMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Changes applied successfully to ${diff.mainFile}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, acceptMessage]);
      
      await handleRefresh();
      
      // If this was a new file, trigger file list refresh
      if (diff.is_new_file) {
        setRefreshTrigger(prev => prev + 1);
      }
      
    } catch (error) {
      console.error("[UI] Error applying changes:", error);
      setError(`Failed to apply changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle discarding individual changes
  const handleDiscard = async (index?: number) => {
    const diffIndex = index ?? 0;
    const diff = pendingDiffs[diffIndex];
    if (!diff) return;
    
    // Remove the discarded diff from pending diffs
    setPendingDiffs(prev => prev.filter((_, i) => i !== diffIndex));
    setError("");
    
    const discardMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: `Changes discarded for ${diff.mainFile}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, discardMessage]);
  };

  // Handle accepting all pending changes
  const handleAcceptAll = async () => {
    if (pendingDiffs.length === 0) return;
    
    setIsProcessing(true);
    setError("");
    
    try {
      // Apply all changes sequentially
      for (const diff of pendingDiffs) {
        const response = await fetch("/api/apply-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: diff.mainFile, content: diff.updated })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to apply changes to ${diff.mainFile}: ${response.status}`);
        }
      }
      
      const acceptAllMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `All ${pendingDiffs.length} changes applied successfully`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, acceptAllMessage]);
      
      // Clear all pending diffs
      setPendingDiffs([]);
      
      await handleRefresh();
      
    } catch (error) {
      console.error("[UI] Error applying all changes:", error);
      setError(`Failed to apply all changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle rejecting all pending changes
  const handleRejectAll = async () => {
    if (pendingDiffs.length === 0) return;
    
    const rejectAllMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: `All ${pendingDiffs.length} changes rejected`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, rejectAllMessage]);
    
    // Clear all pending diffs without applying them
    setPendingDiffs([]);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Panel - Chat */}
      <div className="w-96 flex-shrink-0">
        <ChatPanel
          messages={messages}
          planSteps={planSteps}
          currentPrompt={currentPrompt}
          onPromptChange={setCurrentPrompt}
          onSubmit={handlePromptSubmit}
          onStop={handleStop}
          isProcessing={isProcessing}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          ragEnabled={ragEnabled}
          onRagToggle={setRagEnabled}
        />
      </div>

      {/* Right Panel - Code/Files */}
      <div className="flex-1">
        <RightPanel
          selectedFile={selectedFile}
          fileContent={fileContent}
          onFileSelect={setSelectedFile}
          onFileContentChange={setFileContent}
          changeCounter={changeCounter}
          onRefresh={handleRefresh}
          isProcessing={isProcessing}
          pendingDiffs={pendingDiffs}
          onAcceptDiff={handleAccept}
          onDiscardDiff={handleDiscard}
          onAcceptAllDiffs={handleAcceptAll}
          onRejectAllDiffs={handleRejectAll}
          error={error}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}
