import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { retrieveRelevantChunks } from "./retriever";
import { diff_match_patch } from "diff-match-patch";

function buildExecutorPrompt(task: string, relevantChunks: any[]) {
  let prompt = `Task: ${task}\n\nRelevant code files:\n`;
  for (const chunk of relevantChunks) {
    prompt += `\n--- ${chunk.file} ---\n${chunk.code}\n`;
  }
  prompt += `\n\nAnalyze the task and determine which files need to be modified or created. You can modify existing files or create entirely new files as needed.

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
  return prompt;
}

export async function executeTask(task: string, topK = 5) {
  // const apiKey = process.env.TOGETHER_API_KEY;
  // Together API code commented out
  console.log("[executorAgent] Starting executeTask for task:", task);
  
  // 1. Retrieve relevant code chunks
  const relevantChunks = await retrieveRelevantChunks(task, topK);
  console.log("[executorAgent] Retrieved relevantChunks:", relevantChunks);
  console.log("[executorAgent] Related files found:", relevantChunks.map(chunk => chunk.file));
  console.log("[executorAgent] Task prompt:", task);
  
  // 2. Build the prompt
  const prompt = buildExecutorPrompt(task, relevantChunks);
  console.log("[executorAgent] Built prompt:", prompt);
  // 3. Call OpenAI API instead
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
  const data = await response.json() as any;
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
