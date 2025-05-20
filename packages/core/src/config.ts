export interface LLMConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  language: "ru" | "en";
}

export function getLLMConfig(): LLMConfig {
  return {
    endpoint: "",
    apiKey: "",
    model: "",
    language: "en",
  };
}
