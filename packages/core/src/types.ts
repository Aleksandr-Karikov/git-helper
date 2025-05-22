export interface LLMConfig {
    type: 'openai' | 'claude' | 'llama' | 'mistral' | 'custom';
    endpoint: string;
    apiKey: string;
    model: string;
    language: 'ru' | 'en';
  }
  