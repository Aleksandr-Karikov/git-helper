export const TOKEN_LIMITS = {
  TOTAL: 32768,
  NEW_TOKENS: 1024,
  INPUT: 32768 - 1024,
} as const;

export const PROMPTS = {
  SYSTEM: {
    en: `You are a smart assistant that splits git diff into logical commits.

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
]`,
    ru: `Ты — умный ассистент, который разбивает git diff на логические коммиты.

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
      "src/components/LoginButton.tsx",
      "src/styles/login.css"
    ]
  }
]`
  },
  USER: (diffChunk: string) => 
    `Вот git diff. Разбей изменения на логические коммиты, следуя инструкциям из системного сообщения:\n\n${diffChunk}`
};

export const LOCK_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'pnpm-lock.yml',
  'npm-shrinkwrap.json',
];



