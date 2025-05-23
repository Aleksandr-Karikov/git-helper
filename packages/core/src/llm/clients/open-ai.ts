import { PROMPTS, TOKEN_LIMITS } from '../../config.js';
import { LLMConfig } from '../../types.js';
import { LLMClient } from './types.js';

export class OpenAIClient implements LLMClient {
  async fetch(diffChunk: string, config: LLMConfig): Promise<string> {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: this.prepareHeaders(config),
      body: JSON.stringify(this.prepareBody(diffChunk, config)),
    });

    return this.processStream(response);
  }

  private prepareHeaders(config: LLMConfig) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${config.apiKey}`,
    };

    return headers;
  }

  private prepareBody(diffChunk: string, config: LLMConfig) {
    return {
      model: config.model,
      messages: [
        // TODO language map
        { role: 'system', content: PROMPTS.SYSTEM(config.language === 'en' ? 'English' : 'Russian') },
        { role: 'user', content: PROMPTS.USER(diffChunk) },
      ],
      max_tokens: TOKEN_LIMITS.NEW_TOKENS,
      stream: true,
    };
  }

  private async processStream(response: Response): Promise<string> {
    if (!response.body) throw new Error('Failed to get stream');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        result += this.parseStreamChunk(chunk);
      }
    } finally {
      reader.releaseLock();
    }

    return result.trim();
  }

  private parseStreamChunk(chunk: string): string {
    return chunk
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => {
        try {
          const data = JSON.parse(line.slice(5).trim());
          return data.choices?.[0]?.delta?.content || '';
        } catch {
          return '';
        }
      })
      .join('');
  }
}
