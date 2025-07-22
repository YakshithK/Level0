export function buildPrompt(userRequest: string, relevantChunks: any[]) {
  let prompt = `User request: ${userRequest}\n\nRelevant files:`;
  for (const chunk of relevantChunks) {
    prompt += `\n--- ${chunk.file} (${chunk.symbol}) ---\n${chunk.code}\n`;
  }
  return prompt;
}
