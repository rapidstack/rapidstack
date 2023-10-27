/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable perfectionist/sort-objects */

// @ts-check
/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    '!.*',
    'coverage*',
    'node_modules',
    'pnpm-lock.yaml',
    'dist',
  ],
  plugins: [
    '@typescript-eslint',
    'prettier',
    'import',
    'perfectionist',
    'vitest',
    'jsdoc',
    'eslint-plugin-local-rules',
    'regexp',
    'security',
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/typescript',
    'plugin:perfectionist/recommended-natural',
    'plugin:vitest/recommended',
    'plugin:jsdoc/recommended-typescript',
    'plugin:regexp/recommended',
    'plugin:security/recommended',
  ],
  rules: {
    // Base ESlint Rules
    'no-case-declarations': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TSEnumDeclaration',
        message: 'Use const objects over TS Enums',
      },
    ],
    'max-params': ['error', 3],
    'func-style': ['error', 'declaration', { allowArrowFunctions: false }],
    'max-depth': ['error', 4],
    'no-console': 'warn',

    // Typescript ESlint Plugin Rules
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'all' }],
    '@typescript-eslint/padding-line-between-statements': [
      'error',
      { blankLine: 'always', next: '*', prev: 'block-like' },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'error',

    // Import Plugin Rules
    'import/extensions': ['error', 'ignorePackages'],
    'perfectionist/sort-objects': [
      'error',
      {
        'order': 'asc',
        'partition-by-comment': true,
        'type': 'natural',
      },
    ],

    // JSDoc Plugin Rules
    'jsdoc/informative-docs': 'error',
    'jsdoc/require-throws': 'error',

    // Local Rules
    'local-rules/require-node-prefix': 'error',
    'local-rules/jsdoc-require-throws-async': 'error',
  },
  overrides: [
    {
      extends: ['plugin:markdown/recommended'],
      files: ['**/*.md'],
      processor: 'markdown/markdown',
    },
    {
      excludedFiles: ['**/*.md/*.{ts,tsx}'],
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      rules: {
        'deprecation/deprecation': 'error',
        '@typescript-eslint/no-unnecessary-condition': [
          'error',
          {
            allowConstantLoopConditions: true,
          },
        ],
      },
      plugins: ['deprecation'],
      extends: ['plugin:deprecation/recommended'],
      parserOptions: {
        project: './tsconfig.common.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    // Disable certain fs security rules for the CLI, because they are intended
    {
      files: [
        'packages/cli/src/commands/**/*.ts',
        'packages/cli/src/utils/**/*.ts',
      ],
      rules: {
        'security/detect-non-literal-fs-filename': 'off',
        'security/detect-non-literal-regexp': 'off',
      },
    },
    // Disable certain rules for test because they are only to aid users of code
    {
      files: ['*.test.ts'],
      rules: {
        'jsdoc/require-jsdoc': 'off',
      },
    },
    // Lambda-specific package rules
    {
      files: ['packages/lambda/src/**/*.ts'],
      rules: {
        'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      },
    },
  ],
};

module.exports = config;
