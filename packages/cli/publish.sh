#!/bin/bash

set -e

echo "📦 Preparing package for publish..."

# Проверяем, что jq установлен
if ! command -v jq &> /dev/null
then
  echo "❌ 'jq' is required but not installed. Install with: brew install jq"
  exit 1
fi

# Создаем резервную копию
cp package.json package.json.bak

# Безопасно изменяем dependencies, только если они есть
tmp=$(mktemp)
jq 'if .dependencies and .dependencies["@aktools/git-helper-core"] then
      .dependencies["@aktools/git-helper-core"] = "0.1.0-alpha.0"
    else
      . 
    end' package.json > "$tmp" && mv "$tmp" package.json

# Сборка и публикация
pnpm build
npm publish --access public --tag next

# Возвращаем исходный package.json
mv package.json.bak package.json

echo "✅ Published successfully"
