import eslint from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    ignores: ['node_modules', 'dist', 'build', 'coverage', 'public'],
  },
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      '@tanstack/query': pluginQuery,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // 'no-console': 'warn', // eslint rule
      'react/jsx-no-useless-fragment': 'error', // React rule
      'react-hooks/exhaustive-deps': 'off', // hooks rule
      '@typescript-eslint/no-unused-vars': 'off', // typescript rul
      '@typescript-eslint/no-shadow': 'error', // typescript rule
      // '@typescript-eslint/explicit-module-boundary-types': 'error', // Oblige à typer les exports
      '@typescript-eslint/no-explicit-any': 'error', // Interdit `any`
      // '@typescript-eslint/explicit-function-return-type': 'error', // Oblige à typer les retours de fonction
      '@typescript-eslint/strict-boolean-expressions': 'error', // Force un typage strict des booléens
      // "@typescript-eslint/no-untyped-public-signature": "error" // Empêche les signatures publiques sans type
      // 'no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
