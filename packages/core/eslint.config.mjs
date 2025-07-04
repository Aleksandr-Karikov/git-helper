import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    ignores: ['node_modules', '**/dist/**', '**/vs-code-ext/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.browser },
    ignores: ['node_modules', '**/dist/**', '**/vs-code-ext/**'],
  },
  tseslint.configs.recommended,
]);
