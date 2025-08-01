import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { retrieveRelevantChunks } from "./retriever";
import { diff_match_patch } from "diff-match-patch";
import { ragRetriever } from "./rag_integration";

async function buildExecutorPrompt(task: string, relevantChunks: any[], ragEnabled: boolean = true) {
  let basePrompt = `Task: ${task}\n\nRelevant code files:\n`;
  for (const chunk of relevantChunks) {
    basePrompt += `\n--- ${chunk.file} ---\n${chunk.code}\n`;
  }
  basePrompt += `\n\nAnalyze the task and determine which files need to be modified or created. You can modify existing files or create entirely new files as needed.

IMPORTANT: When creating a new game project, you MUST create an index.html file using this EXACT template format:

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Game Title</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #1a1a1a;
            font-family: Arial, sans-serif;
        }
        #game-container {
            border: 2px solid #333;
            border-radius: 8px;
        }
        canvas {
            display: block;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>
    
    <!-- Phaser.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.70.0/phaser.min.js"></script>
    
    <!-- Include your sprite files here in the order they need to be loaded -->
    <!-- <script src="sprites/YourSprite.js"></script> -->
    
    <!-- Include your scene files here -->
    <!-- <script src="scenes/YourScene.js"></script> -->
    
    <!-- Main Game file (should be last) -->
    <script src="main.js"></script>
</body>
</html>

Replace the comments with actual script tags for the files you create. The loading order should be:
1. Phaser.js CDN
2. All sprite classes
3. All scene classes  
4. Main game file

Format your response as JSON:
{
  "files_to_modify": [
    {
      "filename": "exact_filename_from_above_or_new_filepath",
      "new_content": "complete_file_content_here",
      "is_new_file": false
    }
  ],
  "files_to_create": [
    {
      "filename": "new/file/path.js",
      "new_content": "complete_file_content_here",
      "is_new_file": true
    }
  ]
}

For new files, use appropriate file paths relative to the project root. Return ONLY the JSON response. Make sure all code is syntactically correct.`;

  // Enhance with RAG examples
  const enhancedPrompt = await ragRetriever.enhancePromptWithRAG(basePrompt, task, ragEnabled);
  return enhancedPrompt;
}

async function callLLMAPI(prompt: string, model: "openai" | "kimi") {
  if (model === "kimi") {
    // Call Kimi K2 via Groq API
    const groqApiKey = process.env.GROQ_API_KEY;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2-instruct",
        messages: [
          { role: "system", content: "You are a helpful agent that edits code files as instructed. You are an expert at what you do and follow 100% instructions. Make sure all the code works based on the language given. You excel at tool use, coding, and autonomous problem-solving." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 16384
      })
    });
    return await response.json() as any;
  } else {
    // Call OpenAI API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o", // or "gpt-3.5-turbo"
        messages: [
          { role: "system", content: "You are a helpful agent that edits code files as instructed. You are an expert at what you do and follow 100% instructions. Make sure all the code works based on the language given." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });
    return await response.json() as any;
  }
}

export async function executeTask(task: string, topK = 5, model: "openai" | "kimi" = "openai", ragEnabled = true) {
  // const apiKey = process.env.TOGETHER_API_KEY;
  // Together API code commented out
  console.log("[executorAgent] Starting executeTask for task:", task, "with model:", model);
  
  // 1. Retrieve relevant code chunks
  const relevantChunks = await retrieveRelevantChunks(task, topK);
  console.log("[executorAgent] Retrieved relevantChunks:", relevantChunks);
  console.log("[executorAgent] Related files found:", relevantChunks.map(chunk => chunk.file));
  console.log("[executorAgent] Task prompt:", task);
  
  // 2. Build the prompt with RAG enhancement
  const prompt = await buildExecutorPrompt(task, relevantChunks, ragEnabled);
  console.log("[executorAgent] Built prompt:", prompt);
  
  // 3. Call LLM API (OpenAI or Kimi K2)
  const data = await callLLMAPI(prompt, model);
  const content = data.choices?.[0]?.message?.content || "";
  
  // Parse the JSON response to get multiple files
  let filesToModify: any[] = [];
  let filesToCreate: any[] = [];
  try {
    // Remove code block markers if present
    const cleanContent = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanContent);
    filesToModify = parsed.files_to_modify || [];
    filesToCreate = parsed.files_to_create || [];
  } catch (error) {
    console.error("[executorAgent] Failed to parse multi-file response, falling back to single file");
    // Fallback: treat as single file content
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
