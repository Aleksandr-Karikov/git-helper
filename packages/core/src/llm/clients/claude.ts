import { PROMPTS, TOKEN_LIMITS } from '../../config.js';
import { LLMConfig } from '../../types.js';
import { LLMClient } from './types.js';

export class ClaudeClient implements LLMClient {
  async fetch(diffChunk: string, config: LLMConfig): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
      },
      body: JSON.stringify({
        model: config.model,
        prompt: `${PROMPTS.SYSTEM(config.language === 'en' ? 'English' : 'Russian', config.splitStrategy)}\n\n${PROMPTS.USER(diffChunk)}`,
        max_tokens_to_sample: TOKEN_LIMITS.NEW_TOKENS,
        stream: false,
      }),
    });

    // TODO fix types
    const data = (await response.json()) as { completion: string };
    return data.completion?.trim() || '';
  }
}
