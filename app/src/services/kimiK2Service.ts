import Together from 'together-ai';
import systemPrompt from "../level0_system_prompt.txt?raw";

const TOGETHER_API_KEY = import.meta.env.VITE_TOGETHER_API_KEY || '';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

function isTextBlock(block: any): block is { type: 'text'; text: string } {
  return block && block.type === 'text' && typeof block.text === 'string';
}

function stripCodeBlock(code: string): string {
  return code
    .replace(/^\s*```(?:javascript)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

export class KimiK2Service {
  private together: Together;

  constructor(apiKey?: string) {
    this.together = new Together({
      apiKey: apiKey || TOGETHER_API_KEY
    });
  }

  async generatePhaserScene(promptText: string, isInitialPrompt: boolean = true, conversationHistory: ChatMessage[] = []): Promise<{ thinking: string, code: string }> {
    console.log(TOGETHER_API_KEY)
    const model = 'moonshotai/Kimi-K2-Instruct';

    // Build messages array with conversation history
    const messages: any[] = [];

    // Add conversation history if provided
    if (conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.type === 'user' ? 'user': 'assistant',
          content: msg.content
        });
      });
    }

    // Add the current prompt (without system prompt)
    messages.push({
      role: 'user',
      content: promptText.trim(),
    });

    const response = await this.together.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 4000,
      temperature: 0.6
    });

    // Kimi K2 returns choices[0].message.content
    const fullText = response.choices[0]?.message?.content || '';
    // Extract <Thinking>...</Thinking> and code block
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
    console.log("KimiK2 thinking", response);
    return { thinking, code };
  }
}

export const kimiK2Service = new KimiK2Service(); 