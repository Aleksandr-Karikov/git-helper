import { get_encoding } from "@dqbd/tiktoken";
import { LLMConfig } from "./config.js";

function getSystemPrompt(lang: "ru" | "en"): string {
  if (lang === "en") {
    return `You are a smart assistant that splits git diff into logical commits.

Requirements:
- Respond with **pure JSON array**, no comments, no text.
- Each object: title (imperative, ≤50 chars), description (optional), files (array of "filePath").
- Do not mix unrelated changes.
- A file must belong to only one commit.

Example:
[
  {
    "title": "Fix login button alignment",
    "description": "Adjusted CSS styles on homepage",
    "files": [
      "src/components/LoginButton.tsx",
      "src/styles/login.css"
    ]
  }
]`;
  }

  return `Ты — умный ассистент, который разбивает git diff на логические коммиты.

Обязательно:
- Отвечай только **чистым JSON-массивом**, без текста и комментариев.
- Каждый объект содержит: title (до 50 символов, повелительное наклонение), description (опционально), files (массив "путь").
- Не смешивай разные задачи.
- Один файл не может быть в нескольких коммитах.

Пример:
[
  {
    "title": "Поправь выравнивание кнопки логина",
    "description": "Исправлены стили на главной",
    "files": [
      "src/components/LoginButton.tsx,
      "src/styles/login.css"
    ]
  }
]`;
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const USER_PROMPT = (diffChunk: string) => `
  Вот git diff. Разбей изменения на логические коммиты, следуя инструкциям из системного сообщения:

  ${diffChunk}
`;

const MAX_TOTAL_TOKENS = 32768;
const MAX_NEW_TOKENS = 1024;
const MAX_INPUT_TOKENS = MAX_TOTAL_TOKENS - MAX_NEW_TOKENS;

const enc = get_encoding("cl100k_base");

async function fetchOpenAICompatibleLLM(diffChunk: string, config: LLMConfig): Promise<string> {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      [config.authHeaderKey]: config.authHeaderKey === 'Authorization' ? `Bearer ${config.apiKey}` : config.apiKey,
      
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: getSystemPrompt(config.language) },
        { role: "user", content: USER_PROMPT(diffChunk) },
      ],
      max_tokens: MAX_NEW_TOKENS.toString(),
    }),
  });
  if (!response.body) throw new Error("Failed to get stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data:")) continue;

      const payload = line.slice(5).trim();
      if (payload === "[DONE]") break;

      try {
        const parsed = JSON.parse(payload);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          result += token;
        }
      } catch {
        result += payload;
      }
    }
  }

  return result.trim();
}

export interface Commit {
  title: string;
  description: string;
  files: string[];
}

async function fetchClaudeCompatibleLLM(diffChunk: string, config: LLMConfig): Promise<string> {
  const prompt = `${getSystemPrompt(config.language)}\n\n${USER_PROMPT(diffChunk)}`;

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify({
      model: config.model,
      prompt,
      max_tokens_to_sample: MAX_NEW_TOKENS,
      stream: false, // или true, если нужен SSE-парсинг
    }),
  });

  const json = await response.json() as { completion: string };
  return json.completion || "";
}


export async function analyzeDiffChunk(
  diffChunk: string,
  config: LLMConfig
): Promise<string> {
  switch (config.type) {
    case "openai":
    case "llama":
    case "mistral":
      return fetchOpenAICompatibleLLM(diffChunk, config);
    case "claude":
      return fetchClaudeCompatibleLLM(diffChunk, config);
    case "custom":
    default:
      throw new Error(`Unsupported LLM type: ${config.type}`);
  }
}

function splitDiffIntoTokenSafeChunks(
  diff: string,
  maxTokensPerChunk: number
): string[] {
  const rawFiles = diff.split(/^diff --git .+$/gm);
  const headers = diff.match(/^diff --git .+$/gm) || [];
  const files = headers.map((header, i) => header + (rawFiles[i + 1] || ""));

  const lockFiles = [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "pnpm-lock.yml",
    "npm-shrinkwrap.json",
  ];

  const processedFiles = files.map((fileDiff) => {
    const match = fileDiff.match(/^diff --git a\/(.+?) b\/.+$/m);
    if (!match) return fileDiff;

    const fileName = match[1];
    if (lockFiles.some((lockFile) => fileName.endsWith(lockFile))) {
      return `diff --git a/${fileName} b/${fileName}
--- a/${fileName}
+++ b/${fileName}
@@ LOCK FILE CHANGES HIDDEN @@
+ [lock file changes hidden due to size]
`;
    }

    return fileDiff;
  });

  const chunks: string[] = [];
  let currentChunk = "";
  let currentTokens = 0;

  for (const file of processedFiles) {
    const fileTokens = enc.encode(file).length;

    if (fileTokens > maxTokensPerChunk) {
      const lines = file.split("\n");
      let part = "";
      let partTokens = 0;

      for (const line of lines) {
        const lineTokens = enc.encode(line).length;
        if (partTokens + lineTokens > maxTokensPerChunk) {
          chunks.push(part);
          part = "";
          partTokens = 0;
        }

        part += line + "\n";
        partTokens += lineTokens;
      }

      if (part) chunks.push(part);
      continue;
    }

    if (currentTokens + fileTokens > maxTokensPerChunk) {
      chunks.push(currentChunk);
      currentChunk = "";
      currentTokens = 0;
    }

    currentChunk += file;
    currentTokens += fileTokens;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}


export async function analyzeGitDiff(
  fullDiff: string,
  config: LLMConfig
): Promise<Commit[]> {
  const chunks = splitDiffIntoTokenSafeChunks(fullDiff, MAX_INPUT_TOKENS);
  const results: string[] = [];
  
  for (const chunk of chunks) {
    const result = await analyzeDiffChunk(chunk, config);
    results.push(result);
  }

  const combined = results.join("");
  return JSON.parse(combined) as Commit[];
}
