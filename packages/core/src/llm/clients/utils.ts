import { get_encoding, Tiktoken } from "@dqbd/tiktoken";
import { LOCK_FILES } from "../../config.js";

export class Tokenizer {
  private static encoder: Tiktoken = get_encoding("cl100k_base");

  static countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  static splitText(text: string, maxTokens: number): string[] {
    const tokens = this.encode(text); 
    const chunks: string[] = [];

    for (let i = 0; i < tokens.length; i += maxTokens) {
      const chunk = tokens.slice(i, i + maxTokens); 
      chunks.push(this.decode(chunk)); 
    }

    return chunks;
  }

  static decode(tokens: Uint32Array): string {
    const bytes = this.encoder.decode(tokens)
    return new TextDecoder("utf-8").decode(bytes); 
  }
  
  static encode(text: string): Uint32Array {
    return this.encoder.encode(text);
  }
}

export class DiffProcessor {
    static process(diff: string): string[] {
      return diff.split(/^diff --git .+$/gm)
        .filter(Boolean)
        .map(DiffProcessor.hideLockFiles);
    }
  
    private static hideLockFiles(fileDiff: string): string {
      const fileNameMatch = fileDiff.match(/^diff --git a\/(.+?) b\/.+$/m);
      if (!fileNameMatch) return fileDiff;
  
      const fileName = fileNameMatch[1];
      if (!LOCK_FILES.some(lf => fileName.endsWith(lf))) return fileDiff;
  
      return `diff --git a/${fileName} b/${fileName}
  --- a/${fileName}
  +++ b/${fileName}
  @@ LOCK FILE CHANGES HIDDEN @@
  + [lock file changes hidden due to size]
  `;
    }
  }