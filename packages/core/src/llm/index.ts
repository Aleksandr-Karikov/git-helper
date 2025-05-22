import { TOKEN_LIMITS } from '../config.js';
import { Commit } from '../git/index.js';
import { LLMConfig } from '../types.js';
import { ClaudeClient } from './clients/claude.js';
import { OpenAIClient } from './clients/open-ai.js';
import { LLMClient } from './clients/types.js';
import { DiffProcessor, Tokenizer } from './clients/utils.js';

export * from './clients/types.js';

export class LLMClientFactory {
  static createClient(type: LLMConfig['type']): LLMClient {
    switch (type) {
      case 'openai':
      case 'llama':
      case 'mistral':
        return new OpenAIClient();
      case 'claude':
        return new ClaudeClient();
      default:
        throw new Error(`Unsupported LLM type: ${type}`);
    }
  }
}

export class DiffAnalyzer {
  public static async analyzeGitDiff(fullDiff: string, config: LLMConfig): Promise<Commit[]> {
    const processedDiffs = DiffProcessor.process(fullDiff);
    const chunks = this.splitIntoTokenSafeChunks(processedDiffs);
    const client = LLMClientFactory.createClient(config.type);

    const results = await Promise.all(chunks.map((chunk) => client.fetch(chunk, config)));

    return this.parseResults(results);
  }

  private static splitIntoTokenSafeChunks(diffs: string[]): string[] {
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;

    for (const diff of diffs) {
      const diffTokens = Tokenizer.countTokens(diff);

      if (diffTokens > TOKEN_LIMITS.INPUT) {
        const splitParts = Tokenizer.splitText(diff, TOKEN_LIMITS.INPUT);
        chunks.push(...splitParts);
        continue;
      }

      if (currentTokens + diffTokens > TOKEN_LIMITS.INPUT) {
        chunks.push(currentChunk.join('\n'));
        currentChunk = [];
        currentTokens = 0;
      }

      currentChunk.push(diff);
      currentTokens += diffTokens;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
    }

    return chunks;
  }

  private static cleanResponse(response: string): string {
    const cleaned = response.replace('<think>', '');

    const parts = cleaned.split('</think>');
    return parts[1];
  }
  

  private static parseResults(results: string[]): Commit[] {

    try {
      const parsed = results
        .filter(Boolean)
        .map((r) => JSON.parse(this.cleanResponse(r)) as Commit[]);
  
      return parsed.flat();
    } catch (error) {
      throw new Error(`Failed to parse LLM response: ${(error as Error).message}\nRaw: ${results.join('\n---\n')}`);
    }
  }
  
  
}
