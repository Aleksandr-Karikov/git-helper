import { LLMConfig } from "../../types.js";

export interface LLMClient {
    fetch(diffChunk: string, config: LLMConfig): Promise<string>;
}