import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { retrieveRelevantChunks } from "../retriever";
import { diff_match_patch } from "diff-match-patch";

function buildExecutorPrompt(task: string, relevantChunks: any[]) {
  let prompt = `Task: ${task}\n\nRelevant code:`;
  for (const chunk of relevantChunks) {
    prompt += `\n--- ${chunk.file} ---\n${chunk.code}\n`;
  }
  prompt += "\n\nReturn ONLY the full new file content for the main file you are asked to change. Do not include any markdown or code block formatting.";
  return prompt;
}

export async function executeTask(task: string, topK = 5) {
  console.log("[executorAgent] Starting executeTask for task:", task);
  // 1. Retrieve relevant code chunks
  const relevantChunks = await retrieveRelevantChunks(task, topK);
  console.log("[executorAgent] Retrieved relevantChunks:", relevantChunks);
  // 2. Build the prompt
  const prompt = buildExecutorPrompt(task, relevantChunks);
  console.log("[executorAgent] Built prompt:", prompt);
  // 3. Call KimiK2 (Together AI)
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer YOUR_TOGETHER_API_KEY`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "kimiK2",
      messages: [
        { role: "system", content: "You are a helpful agent that edits code files as instructed." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })
  });
  const data = await response.json() as any;
  console.log("[executorAgent] KimiK2 API response:", data);
  const content = data.choices?.[0]?.message?.content || "";
  // Remove code block markers if present
  const newFileContent = content.replace(/```[a-z]*|```/g, "").trim();
  console.log("[executorAgent] New file content from KimiK2:", newFileContent);
  // 4. Compare original and updated using diff-match-patch
  const dmp = new diff_match_patch();
  const mainFile = relevantChunks[0]?.file || "unknown";
  const original = relevantChunks[0]?.code || "";
  const diff = dmp.diff_main(original, newFileContent);
  dmp.diff_cleanupSemantic(diff);
  console.log("[executorAgent] Diff:", diff);
  // 5. Store pending change (do not overwrite original yet)
  const pendingPath = path.join(process.cwd(), "pending_changes.json");
  let pending = {};
  if (fs.existsSync(pendingPath)) {
    pending = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
  }
  pending[mainFile] = {
    original,
    updated: newFileContent,
    diff,
    task
  };
  fs.writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
  console.log("[executorAgent] Pending changes written to", pendingPath);
  return { mainFile, original, updated: newFileContent, diff };
}
