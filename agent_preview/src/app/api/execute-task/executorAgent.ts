import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { retrieveRelevantChunks } from "../retriever";
import { diff_match_patch } from "diff-match-patch";
import { ragRetriever } from "./rag_integration";

async function buildExecutorPrompt(task: string, relevantChunks: any[], ragEnabled: boolean = true) {
  let basePrompt = `Task: ${task}\n\nRelevant code files:\n`;
  for (const chunk of relevantChunks) {
    basePrompt += `\n--- ${chunk.file} ---\n${chunk.code}\n`;
  }
  basePrompt += `\n\nAnalyze the task and modify existing files or create entirely new files as needed.`;

  // Enhance with RAG examples
  const enhancedPrompt = await ragRetriever.enhancePromptWithRAG(basePrompt, task, ragEnabled);
  return enhancedPrompt;
}

async function callLLMAPI(prompt: string) {
  // Call Kimi K2 via Groq API with function calling
  const groqApiKey = process.env.GROQ_API_KEY;
  
  // Load the comprehensive system prompt
  const systemPromptPath = path.join(process.cwd(), "src", "app", "api", "execute-task", "executor_prompt.txt");
  let systemPrompt = "You are a helpful agent that edits code files as instructed. You are an expert at what you do and follow 100% instructions. Make sure all the code works based on the language given. You excel at tool use, coding, and autonomous problem-solving.";
  
  try {
    systemPrompt = fs.readFileSync(systemPromptPath, "utf8");
  } catch (error) {
    console.warn("[executorAgent] Could not load executor_prompt.txt, using fallback system prompt");
  }
  
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "moonshotai/kimi-k2-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "execute_code_task",
            description: "Execute a code modification or creation task by analyzing the requirements and generating the necessary file changes",
            parameters: {
              type: "object",
              properties: {
                files_to_modify: {
                  type: "array",
                  description: "Array of existing files that need to be modified",
                  items: {
                    type: "object",
                    properties: {
                      filename: {
                        type: "string",
                        description: "The exact filename from the provided context"
                      },
                      new_content: {
                        type: "string",
                        description: "The complete new content for the file"
                      },
                      is_new_file: {
                        type: "boolean",
                        description: "Should be false for existing files being modified"
                      }
                    },
                    required: ["filename", "new_content", "is_new_file"]
                  }
                },
                files_to_create: {
                  type: "array",
                  description: "Array of new files that need to be created",
                  items: {
                    type: "object",
                    properties: {
                      filename: {
                        type: "string",
                        description: "The file path for the new file relative to project root"
                      },
                      new_content: {
                        type: "string",
                        description: "The complete content for the new file"
                      },
                      is_new_file: {
                        type: "boolean",
                        description: "Should be true for new files being created"
                      }
                    },
                    required: ["filename", "new_content", "is_new_file"]
                  }
                }
              },
              required: ["files_to_modify", "files_to_create"]
            }
          }
        }
      ],
      tool_choice: {
        type: "function",
        function: { name: "execute_code_task" }
      },
      temperature: 0.2,
      max_tokens: 16384
    })
  });
  return await response.json() as any;
}

export async function executeTask(task: string, topK = 5, ragEnabled = true) {
  // const apiKey = process.env.TOGETHER_API_KEY;
  // Together API code commented out
  console.log("[executorAgent] Starting executeTask for task:", task, "with Kimi K2 model\n");
  
  // 1. Retrieve relevant code chunks
  const relevantChunks = await retrieveRelevantChunks(task, topK);
  console.log("[executorAgent] Task prompt:", task, "\n");
  console.log("[executorAgent] Relevant chunks found:", relevantChunks.map(chunk => chunk.file), "\n");

  // 2. Build the prompt with RAG enhancement
  const prompt = await buildExecutorPrompt(task, relevantChunks, ragEnabled);
  
  // 3. Call LLM API (Kimi K2) with function calling
  const data = await callLLMAPI(prompt);
  console.log("[executorAgent] Raw API response:", JSON.stringify(data, null, 2));
  
  // Parse the function call response
  let filesToModify: any[] = [];
  let filesToCreate: any[] = [];
  try {
    const message = data.choices?.[0]?.message;
    console.log("[executorAgent] Message from API:", message);
    
    if (message?.tool_calls && message.tool_calls.length > 0) {
      // Extract function call arguments
      const functionCall = message.tool_calls[0];
      console.log("[executorAgent] Function call detected:", functionCall.function.name);
      console.log("[executorAgent] Function arguments:", functionCall.function.arguments);
      
      const functionArgs = JSON.parse(functionCall.function.arguments);
      filesToModify = functionArgs.files_to_modify || [];
      filesToCreate = functionArgs.files_to_create || [];
      
      // Validate function call structure
      if (!Array.isArray(filesToModify) || !Array.isArray(filesToCreate)) {
        throw new Error("Function call returned invalid array structure");
      }
      
      // Validate each file object has required fields
      const validateFileObject = (file: any, type: string) => {
        if (!file.filename || !file.new_content || typeof file.is_new_file !== 'boolean') {
          console.warn(`[executorAgent] Invalid file object in ${type}:`, file);
          return false;
        }
        return true;
      };
      
      filesToModify = filesToModify.filter(file => validateFileObject(file, 'files_to_modify'));
      filesToCreate = filesToCreate.filter(file => validateFileObject(file, 'files_to_create'));
      
      console.log("[executorAgent] Successfully parsed function call response");
      console.log("[executorAgent] Files to modify from function call:", filesToModify.length);
      console.log("[executorAgent] Files to create from function call:", filesToCreate.length);
    } else if (message?.content) {
      // Fallback to content parsing if no function calls
      console.log("[executorAgent] No function calls found, falling back to content parsing");
      const content = message.content;
      const cleanContent = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanContent);
      filesToModify = parsed.files_to_modify || [];
      filesToCreate = parsed.files_to_create || [];
      console.log("[executorAgent] Fallback to content parsing");
    }
  } catch (error) {
    console.error("[executorAgent] Failed to parse function call response, falling back to single file");
    // Final fallback: treat as single file content
    const content = data.choices?.[0]?.message?.content || "";
    const newFileContent = content.replace(/```[a-z]*|```/g, "").trim();
    const mainFile = relevantChunks[0]?.file || "unknown";
    filesToModify = [{
      filename: mainFile,
      new_content: newFileContent,
      is_new_file: false
    }];
  }

  console.log(`[executorAgent] Files to modify: ${filesToModify.map(f => f.filename).join(', ')}`);
  console.log(`[executorAgent] Files to create: ${filesToCreate.map(f => f.filename).join(', ')}`);

  // 4. Process each file that needs modification or creation
  const results: any[] = [];
  const dmp = new diff_match_patch();
  
  // 5. Store pending changes for all modified/created files
  const pendingPath = path.join(process.cwd(), "pending_changes.json");
  let pending: any = {};
  if (fs.existsSync(pendingPath)) {
    pending = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
  }

  // Process existing files to modify
  for (const fileToModify of filesToModify) {
    const filename = fileToModify.filename;
    const newContent = fileToModify.new_content;
    
    // Find the original content for this file
    const originalChunk = relevantChunks.find(chunk => chunk.file === filename);
    const originalContent = originalChunk?.code || "";
    
    // Generate diff
    const diff = dmp.diff_main(originalContent, newContent);
    dmp.diff_cleanupSemantic(diff);
    
    // Store in pending changes
    pending[filename] = {
      original: originalContent,
      updated: newContent,
      diff,
      task,
      is_new_file: false
    };
    
    results.push({
      file: filename,
      original: originalContent,
      updated: newContent,
      diff,
      is_new_file: false
    });
  }

  // Process new files to create
  for (const fileToCreate of filesToCreate) {
    const filename = fileToCreate.filename;
    const newContent = fileToCreate.new_content;
    const originalContent = ""; // New files have no original content
    
    // Generate diff (from empty to new content)
    const diff = dmp.diff_main(originalContent, newContent);
    dmp.diff_cleanupSemantic(diff);
    
    // Store in pending changes
    pending[filename] = {
      original: originalContent,
      updated: newContent,
      diff,
      task,
      is_new_file: true
    };
    
    results.push({
      file: filename,
      original: originalContent,
      updated: newContent,
      diff,
      is_new_file: true
    });
  }

  fs.writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
  
  return {
    modifiedFiles: results,
    task
  };
}
