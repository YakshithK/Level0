import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

function stripCodeBlock(code: string): string {
  return code
    .replace(/^\s*```(?:javascript)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { promptText, isInitialPrompt = true, conversationHistory = [] } = await request.json();
    
    console.log("[GroqK2] Generating Phaser scene for:", promptText.substring(0, 100) + "...");
    
    // Get Groq API key
    const groqApiKey = process.env.GROQ_API_KEY;
    
    // Load system prompt
    const systemPromptPath = path.join(process.cwd(), 'src', 'app', 'api', 'level0_system_prompt.txt');
    let systemPrompt = '';
    
    try {
      systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');
    } catch (error) {
      console.warn("[GroqK2] System prompt file not found, using default");
      systemPrompt = `You are a Phaser.js game development specialist. Generate complete, working Phaser 3 scenes based on user prompts.

CRITICAL REQUIREMENTS:
- ONLY use Phaser.js - no other frameworks
- Generate complete scene classes that extend Phaser.Scene
- Use geometric shapes for all visuals (no external assets)
- Include proper physics and controls
- Add win conditions when appropriate
- Include clear comments

Format your response as:
<Thinking>
[Your reasoning about the game design]
</Thinking>

\`\`\`javascript
[Complete Phaser scene code]
\`\`\``;
    }
    
    // Build messages array with conversation history
    const messages: any[] = [];
    if (conversationHistory.length > 0) {
      conversationHistory.forEach((msg: ChatMessage) => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }
    messages.push({
      role: 'user',
      content: promptText.trim(),
    });

    // Make the API call using fetch like in executorAgent
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
          ...messages
        ],
        max_tokens: 4000,
        temperature: 0.6
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // Parse response
    const fullText = data.choices[0]?.message?.content || '';
    let thinking = '';
    let code = '';
    
    const thinkingMatch = fullText.match(/<Thinking>([\s\S]*?)<\/Thinking>/i);
    if (thinkingMatch) {
      thinking = thinkingMatch[1].trim();
    }
    
    const codeMatch = fullText.match(/```javascript([\s\S]*?)```/i) || fullText.match(/```([\s\S]*?)```/i);
    if (codeMatch) {
      code = codeMatch[1].trim();
    } else {
      code = stripCodeBlock(fullText);
    }
    
    console.log("[GroqK2] Generated code length:", code.length);
    
    return NextResponse.json({
      thinking,
      code,
      success: true
    });
    
  } catch (error) {
    console.error("[GroqK2] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate game code", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
