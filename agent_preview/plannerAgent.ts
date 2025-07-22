// plannerAgent.ts
// This agent uses KimiK2 to break a user prompt into a multi-step plan and saves it to scratchpad.json

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// Integrate with Together AI KimiK2 API
async function kimiK2Plan(prompt: string): Promise<string[]> {
    console.log("Generating plan for prompt:", prompt);
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer 8949d83b545d0ed30d6a44258b8e2c5b41e4294751683eb014c901c55d895009`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "kimiK2",
      messages: [
        { role: "system", content: "Break the following request into a step-by-step plan in JSON array format." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })
  });
  const data = await response.json();
  console.log("KimiK2 response:", data);
  try {
    const plan = JSON.parse(data.choices[0].message.content);
    return plan;
  } catch (e) {
    console.log(e)
    return ["Coulde."];
  }
}

export async function planSteps(userPrompt: string) {
  const steps = await kimiK2Plan(userPrompt);
  fs.writeFileSync(path.join(process.cwd(), "scratchpad.json"), JSON.stringify(steps, null, 2));
  return steps;
}
