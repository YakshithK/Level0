import { Anthropic } from '@anthropic-ai/sdk';
import systemPrompt from "../level0_system_prompt.txt?raw"

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

function isTextBlock(block: any): block is { type: 'text'; text: string } {
  return block && block.type === 'text' && typeof block.text === 'string';
}

function stripCodeBlock(code: string): string {
  return code
    .replace(/^\s*```(?:javascript)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

export class AnthropicService {
  private anthropic: Anthropic;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  async generatePhaserScene(promptText: string): Promise<{ thinking: string, code: string }> {
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n${promptText}`.trim(),
        },
      ],
    });
    const textBlock = response.content.find(isTextBlock);
    const fullText = textBlock ? (textBlock as { text: string }).text : '';
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
    return { thinking, code };
  }
}

export const anthropicService = new AnthropicService();
