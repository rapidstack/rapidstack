/* eslint-disable jsdoc/check-tag-names */
/* eslint-disable perfectionist/sort-objects */

// @ts-check
/** @type {import('eslint').Linter.Config} */
const config = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: [
    '../../.eslintrc.cjs',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:perfectionist/recommended-natural-legacy',
    'plugin:vitest/legacy-recommended',
    'plugin:jsdoc/recommended-typescript',
    'plugin:regexp/recommended',
    'plugin:prettier/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    tsconfigRootDir: __dirname,
    project: 'tsconfig.common.json',
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'perfectionist',
    'vitest',
    'jsdoc',
    'react',
    'react-hooks',
    'regexp',
  ],
  rules: {
    'no-console': ['error'],

    // Import Plugin Rules
    'import/extensions': ['error', 'ignorePackages'],

    // security
    'security/detect-object-injection': 'off',

    // perfectionist
    'perfectionist/sort-union-types': 'off',
  },
  // for tsx files, don't require return types on components
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'func-style': 'off',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};

module.exports = config;
