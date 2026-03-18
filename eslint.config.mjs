import { globalIgnores, defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  globalIgnores(['**/coverage', '**/node_modules']),
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node
      },

      ecmaVersion: 2018,
      sourceType: 'script'
    },

    rules: {
      'prefer-const': 'error',
      strict: ['error', 'global']
    }
  },
  {
    files: ['test/**/*.js', 'test/**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha
      }
    }
  },
  {
    files: ['**/*.mjs'],

    languageOptions: {
      globals: {
        ...globals.node
      },

      ecmaVersion: 2018,
      sourceType: 'module'
    }
  },
  prettierRecommended
]);
