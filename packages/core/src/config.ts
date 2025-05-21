export interface LLMConfig {
  type: "openai" | "llama" | "claude" | "mistral" | "custom";
  model: string;
  apiKey: string;
  endpoint: string;
  language: "en" | "ru";
  authHeaderKey: 'Authorization' | 'X-Auth-Token'
}
