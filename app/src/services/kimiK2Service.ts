import { createSDK } from 'moonshot-node';
import systemPrompt from "../level0_system_prompt.txt?raw";

const MOONSHOT_API_KEY = import.meta.env.VITE_MOONSHOT_API_KEY || '';

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
  private moonshot: ReturnType<typeof createSDK>;

  constructor(apiKey?: string) {
    this.moonshot = createSDK({
      accessToken: apiKey || MOONSHOT_API_KEY,
    });
  }

  async generatePhaserScene(promptText: string, isInitialPrompt: boolean = true, conversationHistory: ChatMessage[] = []): Promise<{ thinking: string, code: string }> {
    const model = 'moonshot-v1-128k';

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

    const response = await this.moonshot.chat.createCompletion.request({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 4000,
      temperature: 0.6
    });

    // Moonshot returns response.choices[0].message.content
    const fullText = response.choices[0]?.message?.content || '';
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
    console.log("Moonshot KimiK2 thinking", response);
    return { thinking, code };
  }
}

export const kimiK2Service = new KimiK2Service(); 