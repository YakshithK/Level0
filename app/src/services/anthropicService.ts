import { Anthropic } from '@anthropic-ai/sdk';

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

  async generatePhaserScene(promptText: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `
You are an expert Phaser game developer.

Generate a complete Phaser 3 Scene class in JavaScript. The class name MUST be DynamicScene (i.e., 'class DynamicScene extends Phaser.Scene'). Don't use any images or external files. Just use basic shapes for now. The user prompt is:
"${promptText}"

Only return valid, runnable JavaScript code for the scene class. Don't explain anything. Also dont use any file assets because you don't have access to them. Don't use any image files at all.
          `.trim(),
        },
      ],
    });
    const textBlock = response.content.find(isTextBlock);
    const code = textBlock ? (textBlock as { text: string }).text : '';
    return stripCodeBlock(code);
  }
}

export const anthropicService = new AnthropicService();
