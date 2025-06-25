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

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
}

export class AnthropicService {
  private anthropic: Anthropic;

  constructor(apiKey?: string) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true
    });
    
  }

  async generatePhaserScene(promptText: string, isInitialPrompt: boolean = true, conversationHistory: ChatMessage[] = []): Promise<{ thinking: string, code: string }> {
    const model = isInitialPrompt ? 'claude-3-haiku-20240307' : 'claude-3-haiku-20240307';
    
    // Build messages array with conversation history
    const messages: any[] = [];
    
    // Add conversation history if provided
    if (conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }
    
    // Add the current prompt
    messages.push({
      role: 'user',
      content: `${systemPrompt}\n\n${promptText}`.trim(),
    });
    
    // Log the messages being sent to AI
    console.log('=== AI SERVICE CALL ===');
    console.log('Model:', model);
    console.log('Is Initial Prompt:', isInitialPrompt);
    console.log('Conversation History Length:', conversationHistory.length);
    console.log('Total Messages to AI:', messages.length);
    console.log('Messages:', messages);
    console.log('========================');
    
    const response = await this.anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      messages: messages,
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
    console.log("thinking", response)
    return { thinking, code };
  }
}

export const anthropicService = new AnthropicService();
