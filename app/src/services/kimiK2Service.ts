import systemPrompt from "../level0_system_prompt.txt?raw";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

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

export class KimiK2Service {
  private groqApiKey: string;

  constructor(apiKey?: string) {
    this.groqApiKey = apiKey || GROQ_API_KEY;
  }

  async generatePhaserScene(promptText: string, isInitialPrompt: boolean = true, conversationHistory: ChatMessage[] = []): Promise<{ thinking: string, code: string }> {
    const model = 'moonshotai/kimi-k2-instruct';

    // Build messages array with conversation history
    const messages: any[] = [];
    if (conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.type === 'user' ? 'user': 'assistant',
          content: msg.content
        });
      });
    }
    messages.push({
      role: 'user',
      content: promptText.trim(),
    });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
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

    const data = await response.json();

    // Groq returns response.choices[0].message.content
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
    console.log("Groq KimiK2 response", data);
    return { thinking, code };
  }
}

export const kimiK2Service = new KimiK2Service(); 