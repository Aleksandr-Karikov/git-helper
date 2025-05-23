import { get_encoding, Tiktoken } from '@dqbd/tiktoken';

export class Tokenizer {
  private static encoder: Tiktoken = get_encoding('cl100k_base');

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
    const bytes = this.encoder.decode(tokens);
    return new TextDecoder('utf-8').decode(bytes);
  }

  static encode(text: string): Uint32Array {
    return this.encoder.encode(text);
  }
}

export class DiffProcessor {
  static process(diff: string, hiddenFilePatterns: (string | RegExp)[] = []): string[] {
    const fileDiffs = diff.split(/^diff --git .+$/gm).filter(Boolean);

    return fileDiffs.map((fd) => DiffProcessor.hideMatchedFiles(fd, hiddenFilePatterns));
  }

  private static hideMatchedFiles(fileDiff: string, patterns: (string | RegExp)[]): string {
    const fileNameMatch = fileDiff.match(/^diff --git a\/(.+?) b\/.+$/m);
    if (!fileNameMatch) return fileDiff;

    const fileName = fileNameMatch[1];

    const shouldHide = patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return fileName.endsWith(pattern);
      }
      return pattern.test(fileName);
    });

    if (!shouldHide) return fileDiff;

    return `diff --git a/${fileName} b/${fileName}
--- a/${fileName}
+++ b/${fileName}
@@ LOCK FILE CHANGES HIDDEN @@
+ [lock file changes hidden due to size]
`;
  }
}
