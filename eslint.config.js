/* ESLint flat config (ESLint 9) shared by the whole repo so everyone lints
   with the same rules:
   - client/: React 19 + TypeScript (browser globals, react-hooks, react-refresh)
   - server/: plain JavaScript, CommonJS (node globals)

   Run from the repo root:  npm run lint        (or npm run lint:fix)
   Or inside client/ or server/: npm run lint   (config is found up the tree)
*/
'use strict';

const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const globals = require('globals');

module.exports = tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/.env',
      '*.log',
      '**/*.log',
    ],
  },
  js.configs.recommended,

  /* Config files at the repo root (CommonJS, node globals). */
  {
    files: ['eslint.config.js', 'ecosystem.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },

  /* server: plain JavaScript, CommonJS, Node. */
  {
    files: ['server/src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  /* client: React 19 + TypeScript, browser. */
  {
    files: ['client/src/**/*.{ts,tsx}', 'client/vite.config.ts'],
    extends: tseslint.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
